package com.sporekart.shared.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 120;
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 15;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        long resetTime;
        int count;

        RequestCounter(long resetTime, int count) {
            this.resetTime = resetTime;
            this.count = count;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();
        long now = System.currentTimeMillis();

        boolean isAuthEndpoint = uri.startsWith("/api/v1/auth") || uri.startsWith("/admin/auth");
        int maxAllowed = isAuthEndpoint ? MAX_AUTH_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;

        String key = clientIp + ":" + (isAuthEndpoint ? "AUTH" : "GENERAL");

        RequestCounter counter = requestCounts.compute(key, (k, existing) -> {
            if (existing == null || now > existing.resetTime) {
                return new RequestCounter(now + 60_000L, 1);
            } else {
                existing.count++;
                return existing;
            }
        });

        if (counter.count > maxAllowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Please slow down your requests.\"}}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
