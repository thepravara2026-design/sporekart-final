package com.sporekart.shared.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.shared.api.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Enforces strict CSRF protection on mutating requests using Origin/Referer header verification
 * for cookie-authenticated sessions (SameSite=Lax defense-in-depth).
 */
@Slf4j
@Component
public class CsrfOriginValidationFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final Set<String> allowedOrigins;
    private final boolean isDevOrTest;
    private final ObjectMapper objectMapper;

    public CsrfOriginValidationFilter(
            @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:8080}") List<String> allowedOrigins,
            Environment environment,
            ObjectMapper objectMapper) {
        this.allowedOrigins = allowedOrigins != null ? allowedOrigins.stream()
                .filter(s -> !s.isBlank())
                .map(this::normalizeOrigin)
                .collect(Collectors.toSet()) : Set.of();
        this.isDevOrTest = environment != null && environment.acceptsProfiles(Profiles.of("dev", "test"));
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod().toUpperCase();
        if (SAFE_METHODS.contains(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only enforce CSRF verification if request relies on cookie authentication
        boolean hasAuthCookie = hasAuthCookie(request);
        if (!hasAuthCookie) {
            filterChain.doFilter(request, response);
            return;
        }

        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");
        String sourceOrigin = null;

        if (origin != null && !origin.isBlank()) {
            sourceOrigin = normalizeOrigin(origin);
        } else if (referer != null && !referer.isBlank()) {
            try {
                URI uri = URI.create(referer);
                sourceOrigin = uri.getScheme() + "://" + uri.getHost() + (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443 ? ":" + uri.getPort() : "");
            } catch (Exception e) {
                log.warn("Invalid Referer header in mutating cookie request: {}", referer);
            }
        }

        if (sourceOrigin == null) {
            // Missing Origin and Referer on a mutating request carrying session cookie
            if (!isDevOrTest) {
                log.warn("CSRF_REJECTED: Mutating request {} {} carrying auth cookie missing both Origin and Referer headers", method, request.getRequestURI());
                rejectCsrf(response, "Cross-site request forgery check failed: Missing Origin/Referer");
                return;
            }
        } else {
            boolean isAllowed = isOriginAllowed(sourceOrigin);
            if (!isAllowed) {
                log.warn("CSRF_REJECTED: Origin {} is not in allowed origins for {} {}", sourceOrigin, method, request.getRequestURI());
                rejectCsrf(response, "Cross-site request forgery check failed: Untrusted Origin");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasAuthCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return false;
        return Arrays.stream(cookies).anyMatch(c -> "sporekart_token".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank());
    }

    private boolean isOriginAllowed(String origin) {
        if (allowedOrigins.contains(origin)) {
            return true;
        }
        if (isDevOrTest) {
            if (origin.contains("localhost") || origin.contains("127.0.0.1")) {
                return true;
            }
        }
        // Subdomain checks for deployment environments
        if (origin.endsWith(".sporekart.in") || origin.endsWith(".vercel.app") || origin.endsWith(".railway.app")) {
            return true;
        }
        return false;
    }

    private String normalizeOrigin(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.toLowerCase();
    }

    private void rejectCsrf(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        String json = objectMapper.writeValueAsString(ApiResponse.error("CSRF_FORBIDDEN", message));
        response.getWriter().write(json);
    }
}

