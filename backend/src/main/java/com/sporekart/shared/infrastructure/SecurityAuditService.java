package com.sporekart.shared.infrastructure;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Centralized Security Audit Logging and Micrometer Metrics Service.
 * Emits structured security events with [SECURITY_AUDIT] prefix for log ingestion (Datadog/CloudWatch/Loki)
 * and increments real-time Micrometer counters for alerting platforms (Prometheus/Grafana/Datadog).
 */
@Service
public class SecurityAuditService {

    private static final Logger AUDIT_LOGGER = LoggerFactory.getLogger("SECURITY_AUDIT");

    private final MeterRegistry meterRegistry;
    private final Counter failedLoginCounter;
    private final Counter adminLoginSuccessCounter;
    private final Counter roleChangeCounter;
    private final Counter paymentFailureCounter;
    private final Counter suspiciousWebhookCounter;
    private final Counter rateLimitTrippedCounter;
    private final Counter csrfRejectionCounter;

    public SecurityAuditService(@Autowired(required = false) MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        if (meterRegistry != null) {
            this.failedLoginCounter = Counter.builder("security.audit.events")
                    .tag("event", "failed_login")
                    .description("Count of failed authentication attempts")
                    .register(meterRegistry);
            this.adminLoginSuccessCounter = Counter.builder("security.audit.events")
                    .tag("event", "admin_login_success")
                    .description("Count of successful admin logins")
                    .register(meterRegistry);
            this.roleChangeCounter = Counter.builder("security.audit.events")
                    .tag("event", "role_change")
                    .description("Count of user role changes")
                    .register(meterRegistry);
            this.paymentFailureCounter = Counter.builder("security.audit.events")
                    .tag("event", "payment_failure")
                    .description("Count of payment processing failures or verification rejections")
                    .register(meterRegistry);
            this.suspiciousWebhookCounter = Counter.builder("security.audit.events")
                    .tag("event", "suspicious_webhook")
                    .description("Count of suspicious webhook payloads or invalid signatures")
                    .register(meterRegistry);
            this.rateLimitTrippedCounter = Counter.builder("security.audit.events")
                    .tag("event", "rate_limit_tripped")
                    .description("Count of rate limit violations")
                    .register(meterRegistry);
            this.csrfRejectionCounter = Counter.builder("security.audit.events")
                    .tag("event", "csrf_rejected")
                    .description("Count of CSRF origin/referer check failures")
                    .register(meterRegistry);
        } else {
            this.failedLoginCounter = null;
            this.adminLoginSuccessCounter = null;
            this.roleChangeCounter = null;
            this.paymentFailureCounter = null;
            this.suspiciousWebhookCounter = null;
            this.rateLimitTrippedCounter = null;
            this.csrfRejectionCounter = null;
        }
    }

    public void recordFailedLogin(String userOrEmail, String clientIp, String reason) {
        if (failedLoginCounter != null) failedLoginCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=FAILED_LOGIN user={} ip={} reason={}",
                sanitize(userOrEmail), sanitize(clientIp), sanitize(reason));
    }

    public void recordSuccessfulAdminLogin(String userOrEmail, String clientIp) {
        if (adminLoginSuccessCounter != null) adminLoginSuccessCounter.increment();
        AUDIT_LOGGER.info("[SECURITY_AUDIT] event=ADMIN_LOGIN_SUCCESS user={} ip={}",
                sanitize(userOrEmail), sanitize(clientIp));
    }

    public void recordRoleChange(String targetUser, String changedBy, String oldRole, String newRole) {
        if (roleChangeCounter != null) roleChangeCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=ROLE_CHANGE targetUser={} changedBy={} oldRole={} newRole={}",
                sanitize(targetUser), sanitize(changedBy), sanitize(oldRole), sanitize(newRole));
    }

    public void recordPaymentFailure(String orderOrPaymentId, String reason, String clientIp) {
        if (paymentFailureCounter != null) paymentFailureCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=PAYMENT_FAILURE id={} ip={} reason={}",
                sanitize(orderOrPaymentId), sanitize(clientIp), sanitize(reason));
    }

    public void recordSuspiciousWebhook(String provider, String clientIp, String reason) {
        if (suspiciousWebhookCounter != null) suspiciousWebhookCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=SUSPICIOUS_WEBHOOK provider={} ip={} reason={}",
                sanitize(provider), sanitize(clientIp), sanitize(reason));
    }

    public void recordRateLimitTrip(String clientIp, String path, int reqCount) {
        if (rateLimitTrippedCounter != null) rateLimitTrippedCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=RATE_LIMIT_TRIPPED ip={} path={} count={}",
                sanitize(clientIp), sanitize(path), reqCount);
    }

    public void recordCsrfRejection(String clientIp, String path, String origin, String referer) {
        if (csrfRejectionCounter != null) csrfRejectionCounter.increment();
        AUDIT_LOGGER.warn("[SECURITY_AUDIT] event=CSRF_REJECTED ip={} path={} origin={} referer={}",
                sanitize(clientIp), sanitize(path), sanitize(origin), sanitize(referer));
    }

    public Counter getFailedLoginCounter() {
        return failedLoginCounter;
    }

    public Counter getAdminLoginSuccessCounter() {
        return adminLoginSuccessCounter;
    }

    public Counter getRoleChangeCounter() {
        return roleChangeCounter;
    }

    public Counter getPaymentFailureCounter() {
        return paymentFailureCounter;
    }

    public Counter getSuspiciousWebhookCounter() {
        return suspiciousWebhookCounter;
    }

    public Counter getRateLimitTrippedCounter() {
        return rateLimitTrippedCounter;
    }

    public Counter getCsrfRejectionCounter() {
        return csrfRejectionCounter;
    }

    private String sanitize(String input) {
        if (input == null) return "UNKNOWN";
        return input.replaceAll("[\\r\\n\\t]", "_").trim();
    }
}
