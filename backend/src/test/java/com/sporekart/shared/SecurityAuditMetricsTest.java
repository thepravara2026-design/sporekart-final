package com.sporekart.shared;

import com.sporekart.shared.infrastructure.SecurityAuditService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Security Audit Logging & Micrometer Metrics Verification Tests")
class SecurityAuditMetricsTest {

    private MeterRegistry meterRegistry;
    private SecurityAuditService auditService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        auditService = new SecurityAuditService(meterRegistry);
    }

    @Test
    @DisplayName("failedLogin records structured event and increments Micrometer counter")
    void testFailedLoginRecordsMetric() {
        auditService.recordFailedLogin("attacker@bad.com", "192.168.1.100", "Bad credentials");
        auditService.recordFailedLogin("attacker@bad.com", "192.168.1.100", "Bad token");

        assertThat(auditService.getFailedLoginCounter().count()).isEqualTo(2.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "failed_login")
                .counter()
                .count()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("successfulAdminLogin records structured event and increments Micrometer counter")
    void testAdminLoginSuccessRecordsMetric() {
        auditService.recordSuccessfulAdminLogin("admin@sporekart.in", "10.0.0.1");

        assertThat(auditService.getAdminLoginSuccessCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "admin_login_success")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("roleChange records structured event and increments Micrometer counter")
    void testRoleChangeRecordsMetric() {
        auditService.recordRoleChange("user@test.com", "SUPERADMIN", "ROLE_CUSTOMER", "ROLE_ADMIN");

        assertThat(auditService.getRoleChangeCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "role_change")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("paymentFailure records structured event and increments Micrometer counter")
    void testPaymentFailureRecordsMetric() {
        auditService.recordPaymentFailure("order_12345", "Signature mismatch", "172.16.0.5");

        assertThat(auditService.getPaymentFailureCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "payment_failure")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("suspiciousWebhook records structured event and increments Micrometer counter")
    void testSuspiciousWebhookRecordsMetric() {
        auditService.recordSuspiciousWebhook("Shiprocket", "203.0.113.1", "Invalid token signature");

        assertThat(auditService.getSuspiciousWebhookCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "suspicious_webhook")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("rateLimitTrip records structured event and increments Micrometer counter")
    void testRateLimitTripRecordsMetric() {
        auditService.recordRateLimitTrip("198.51.100.22", "/auth/login", 31);

        assertThat(auditService.getRateLimitTrippedCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "rate_limit_tripped")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("csrfRejection records structured event and increments Micrometer counter")
    void testCsrfRejectionRecordsMetric() {
        auditService.recordCsrfRejection("198.51.100.22", "/orders", "http://evil.com", "http://evil.com/phish");

        assertThat(auditService.getCsrfRejectionCounter().count()).isEqualTo(1.0);
        assertThat(meterRegistry.find("security.audit.events")
                .tag("event", "csrf_rejected")
                .counter()
                .count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Gracefully operates when MeterRegistry is null")
    void testOperatesWithoutMeterRegistry() {
        SecurityAuditService standalone = new SecurityAuditService(null);
        standalone.recordFailedLogin("test@user.com", "127.0.0.1", "Invalid token");
        standalone.recordSuccessfulAdminLogin("admin@sporekart.in", "127.0.0.1");
        standalone.recordRoleChange("test@user.com", "ADMIN", "ROLE_CUSTOMER", "ROLE_ADMIN");
        standalone.recordPaymentFailure("order_999", "Failed", "127.0.0.1");
        standalone.recordSuspiciousWebhook("Gateway", "127.0.0.1", "Signature error");
        standalone.recordRateLimitTrip("127.0.0.1", "/api/test", 50);
        standalone.recordCsrfRejection("127.0.0.1", "/api/test", "origin", "referer");

        assertThat(standalone.getFailedLoginCounter()).isNull();
    }
}
