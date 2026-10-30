package com.sporekart.shared.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = getJwtFromRequest(request);

        if (StringUtils.hasText(token)) {
            if (tokenProvider.validateToken(token)) {
                Authentication authentication = tokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                SecurityContextHolder.clearContext();
                clearAuthCookies(response);

                // For public endpoints (e.g. browsing products, catalog, cart), allow guests through even if an expired/stale token was sent
                if (isPublicEndpoint(request)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");

                String json = objectMapper.writeValueAsString(
                        com.sporekart.shared.api.ApiResponse.error("UNAUTHORIZED", "Authentication required or token expired"));
                response.getWriter().write(json);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie.from("sporekart_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString());

        org.springframework.http.ResponseCookie clearJwtCookie = org.springframework.http.ResponseCookie.from("JWT_TOKEN", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, clearJwtCookie.toString());
    }

    private boolean isPublicEndpoint(HttpServletRequest request) {
        String path = request.getServletPath();
        if (!StringUtils.hasText(path)) {
            path = request.getRequestURI();
        }
        if (StringUtils.hasText(path)) {
            if (path.startsWith("/api/v1")) {
                path = path.substring(7);
            }
        }
        if (!StringUtils.hasText(path)) {
            return false;
        }

        String method = request.getMethod() != null ? request.getMethod().toUpperCase() : "GET";

        if (path.startsWith("/auth/") || path.startsWith("/admin/auth/")) {
            return true;
        }
        if (path.startsWith("/actuator/health") || path.startsWith("/actuator/info")
                || path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            return true;
        }
        if (path.equals("/cart") || path.startsWith("/cart/")) {
            return true;
        }
        if ("GET".equals(method)) {
            if (path.equals("/catalog") || path.startsWith("/catalog")
                    || path.equals("/products") || path.startsWith("/products")
                    || path.equals("/categories") || path.startsWith("/categories")
                    || path.equals("/reviews") || path.startsWith("/reviews")
                    || path.equals("/activities") || path.startsWith("/activities")
                    || path.equals("/search") || path.startsWith("/search")
                    || path.startsWith("/content")
                    || path.startsWith("/training/courses") || path.startsWith("/training/glimpses")
                    || path.startsWith("/shipping/check-pincode")
                    || path.startsWith("/seo")
                    || path.startsWith("/media")
                    || path.startsWith("/promotions")
                    || path.equals("/payment/summary")
                    || (path.startsWith("/orders/") && !path.startsWith("/orders/admin"))) {
                return true;
            }
        }
        if ("POST".equals(method)) {
            if (path.equals("/orders") || path.equals("/orders/")
                    || path.startsWith("/payment/webhook") || path.startsWith("/shipping/webhook")
                    || path.startsWith("/analytics/track-")
                    || path.equals("/create-order") || path.equals("/verify-payment")
                    || path.equals("/payment/create-order") || path.equals("/payment/verify-payment")
                    || path.equals("/payment/initiate") || path.equals("/payment/verify")
                    || path.equals("/training/enroll") || path.equals("/training/bookings")) {
                return true;
            }
        }
        return false;
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("sporekart_token".equals(cookie.getName()) || "JWT_TOKEN".equals(cookie.getName())) {
                    if (StringUtils.hasText(cookie.getValue())) {
                        return cookie.getValue();
                    }
                }
            }
        }
        return null;
    }
}
