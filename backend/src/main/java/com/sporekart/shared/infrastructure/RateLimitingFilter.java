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
 * Proxy-aware per-IP rate-limiting filter with sensitive endpoint abuse controls.
 * NOTE: This in-memory rate-limiting filter is designed for single-instance deployments.
 * If/when SporeKart is horizontally scaled across multiple backend instances, this state
 * must be moved to a shared distributed store (such as Redis or database-backed rate limiting).
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_GENERAL_REQUESTS_PER_MINUTE = 500;
    private static final int MAX_SENSITIVE_REQUESTS_PER_MINUTE = 30;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private final Set<String> trustedProxies;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

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

        // Bypass or higher threshold in test profile to allow batch suite execution unless specifically testing rate limiter
        if ("test".equalsIgnoreCase(activeProfile) && !"true".equals(request.getHeader("X-Test-Rate-Limit"))) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();
        String method = request.getMethod();
        long now = System.currentTimeMillis();

        boolean isAuth = uri.startsWith("/auth") || uri.startsWith("/api/v1/auth") || uri.startsWith("/admin/auth");
        boolean isSensitiveAction = uri.startsWith("/analytics/track-")
                || uri.startsWith("/training/enroll")
                || uri.startsWith("/training/bookings")
                || (uri.startsWith("/support/tickets") && "POST".equalsIgnoreCase(method))
                || uri.startsWith("/cart/apply-promotion")
                || uri.startsWith("/promotions/validate-batch")
                || uri.startsWith("/promocode");

        int maxAllowed = (isAuth || isSensitiveAction) ? MAX_SENSITIVE_REQUESTS_PER_MINUTE : MAX_GENERAL_REQUESTS_PER_MINUTE;
        String category = isAuth ? "AUTH" : (isSensitiveAction ? "SENSITIVE" : "GENERAL");
        String key = clientIp + ":" + category;

        RequestCounter counter = requestCounts.compute(key, (k, existing) -> {
            if (existing == null || now > existing.resetTime) {
                return new RequestCounter(now + 60_000L, 1);
            } else {
                existing.count++;
                return existing;
            }
        });

        if (counter.count > maxAllowed) {
            long retryAfterSeconds = Math.max(1, (counter.resetTime - now) / 1000L);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            String json = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(com.sporekart.shared.api.ApiResponse.error("TOO_MANY_REQUESTS", "Rate limit exceeded. Please try again in " + retryAfterSeconds + " seconds."));
            response.getWriter().write(json);
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredCounters() {
        long now = System.currentTimeMillis();
        requestCounts.entrySet().removeIf(entry -> now > entry.getValue().resetTime);
    }

    public void clearAll() {
        requestCounts.clear();
    }

    private String getClientIp(HttpServletRequest request) {
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (cfConnectingIp != null && !cfConnectingIp.isBlank()) {
            return cfConnectingIp.trim();
        }

        String trueClientIp = request.getHeader("True-Client-IP");
        if (trueClientIp != null && !trueClientIp.isBlank()) {
            return trueClientIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && (trustedProxies.contains(remoteAddr) || trustedProxies.isEmpty())) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0].trim();
            }
        }
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr.trim() : "127.0.0.1";
    }
}
