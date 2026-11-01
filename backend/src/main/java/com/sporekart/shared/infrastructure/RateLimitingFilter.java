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
import java.net.Inet6Address;
import java.net.InetAddress;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
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

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\." +
             "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\." +
             "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\." +
             "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );

    private static final Pattern IPV6_PATTERN = Pattern.compile(
            "^[0-9a-fA-F:]{2,39}$"
    );

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private final Set<String> trustedProxies;
    private final SecurityAuditService securityAuditService;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @org.springframework.beans.factory.annotation.Autowired
    public RateLimitingFilter(
            @Value("${app.rate-limiting.trusted-proxies:}") List<String> trustedProxies,
            @org.springframework.beans.factory.annotation.Autowired(required = false) SecurityAuditService securityAuditService) {
        this.trustedProxies = trustedProxies != null ? trustedProxies.stream()
                .filter(s -> !s.isBlank())
                .map(String::trim)
                .collect(Collectors.toSet()) : Set.of();
        this.securityAuditService = securityAuditService;
    }

    public RateLimitingFilter(List<String> trustedProxies) {
        this(trustedProxies, null);
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
        long now = System.currentTimeMillis();

        boolean isAuth = uri.startsWith("/auth") || uri.startsWith("/api/v1/auth") || uri.startsWith("/admin/auth");
        boolean isSupport = uri.startsWith("/support");
        boolean isTrainingEnroll = uri.startsWith("/training/enroll") || uri.startsWith("/training/bookings");
        boolean isPromoCode = uri.startsWith("/promocode") || uri.startsWith("/cart/apply-promotion") || uri.startsWith("/promotions/validate-batch");
        boolean isOtherSensitive = uri.startsWith("/analytics/track-");

        boolean isSensitive = isAuth || isSupport || isTrainingEnroll || isPromoCode || isOtherSensitive;
        int maxAllowed = isSensitive ? MAX_SENSITIVE_REQUESTS_PER_MINUTE : MAX_GENERAL_REQUESTS_PER_MINUTE;

        String category;
        if (isAuth) {
            category = "AUTH";
        } else if (isSupport) {
            category = "SUPPORT";
        } else if (isTrainingEnroll) {
            category = "TRAINING";
        } else if (isPromoCode) {
            category = "PROMO";
        } else if (isOtherSensitive) {
            category = "SENSITIVE";
        } else {
            category = "GENERAL";
        }

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
            if (securityAuditService != null) {
                securityAuditService.recordRateLimitTrip(clientIp, request.getRequestURI(), counter.count);
            }
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

    public static boolean isValidIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        String trimmed = ip.trim();
        if (IPV4_PATTERN.matcher(trimmed).matches()) {
            return true;
        }
        if (IPV6_PATTERN.matcher(trimmed).matches() && trimmed.contains(":")) {
            try {
                InetAddress addr = InetAddress.getByName(trimmed);
                return addr instanceof Inet6Address;
            } catch (Exception ignored) {
                return false;
            }
        }
        return false;
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return false;
        }
        String trimmed = remoteAddr.trim();
        if (trustedProxies.contains("*") || trustedProxies.contains("ALL")) {
            return true;
        }
        return trustedProxies.contains(trimmed);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        String fallback = (remoteAddr != null && !remoteAddr.isBlank() && isValidIp(remoteAddr.trim()))
                ? remoteAddr.trim()
                : "127.0.0.1";

        // Only parse forwarded proxy headers if the request directly connects from a trusted proxy
        if (!isTrustedProxy(remoteAddr)) {
            return fallback;
        }

        // 1. CF-Connecting-IP (Cloudflare)
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (isValidIp(cfConnectingIp)) {
            return cfConnectingIp.trim();
        }

        // 2. True-Client-IP (Cloudflare Enterprise / Akamai)
        String trueClientIp = request.getHeader("True-Client-IP");
        if (isValidIp(trueClientIp)) {
            return trueClientIp.trim();
        }

        // 3. X-Forwarded-For (standard reverse proxy)
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            String firstEntry = xfHeader.split(",")[0].trim();
            if (isValidIp(firstEntry)) {
                return firstEntry;
            }
        }

        return fallback;
    }
}
