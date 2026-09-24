package com.sporekart.shared.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * NOTE: This in-memory rate-limiting filter is designed for single-instance deployments.
 * If/when SporeKart is horizontally scaled across multiple backend instances, this state
 * must be moved to a shared distributed store (such as Redis or database-backed rate limiting).
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 120;
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 15;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private final Set<String> trustedProxies;

    public RateLimitingFilter(
            @Value("${app.rate-limiting.trusted-proxies:}") List<String> trustedProxies) {
        this.trustedProxies = trustedProxies != null ? trustedProxies.stream()
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet()) : Set.of();
    }

    static class RequestCounter {
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

        boolean isAuthEndpoint = uri.startsWith("/auth") || uri.startsWith("/api/v1/auth") || uri.startsWith("/admin/auth");
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

    @Scheduled(fixedRate = 60000)
    public void evictExpiredCounters() {
        long now = System.currentTimeMillis();
        requestCounts.entrySet().removeIf(entry -> now > entry.getValue().resetTime);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && trustedProxies.contains(remoteAddr)) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0].trim();
            }
        }
        return remoteAddr;
    }
}
