package com.sporekart.shared.infrastructure;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityConfigValidator {

    private final Environment environment;

    private static final Set<String> INSECURE_DEFAULTS = Set.of(
            "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971",
            "c3BvcmVrYXJ0LXNlY3JldC1rZXktZm9yLXRlc3RpbmctcHVycG9zZXMtMjU2Yml0cw==",
            "rzp_test_Tqs0MmdXUl8FRk",
            "dFrgcYKVv0wBEtGgogcZpFHT",
            "mockwebhooksecret123",
            "sporekart_shiprocket_webhook_secret_key_2026",
            "MyDbSporekart@123#",
            "dev_fake_jwt_secret_key_needs_to_be_at_least_32_bytes_long_12345",
            "ZGV2X2Zha2Vfand0X3NlY3JldF9rZXlfMzJieXRlcyE=",
            "dGVzdF9mYWtlX2p3dF9zZWNyZXRfa2V5XzMyYnl0ZQ==",
            "rzp_test_fake_dev_key_id",
            "fake_dev_key_secret",
            "fake_dev_webhook_secret",
            "fake_dev_shiprocket_webhook_token"
    );

    @PostConstruct
    public void validateOnStartup() {
        boolean isDevOrTest = environment.acceptsProfiles(Profiles.of("dev", "test"));
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod", "production")) || !isDevOrTest;

        if (isProd) {
            log.info("Production profile active - running fail-closed security configuration audit...");

            // 1. Verify Razorpay Mock Mode is OFF
            String mockMode = environment.getProperty("app.razorpay.mock-mode");
            if ("true".equalsIgnoreCase(mockMode)) {
                throw new IllegalStateException("FAIL-CLOSED: app.razorpay.mock-mode must NOT be enabled in production!");
            }

            // 2. Verify JWT Secret
            String jwtSecret = environment.getProperty("app.jwt.secret");
            if (!StringUtils.hasText(jwtSecret) || INSECURE_DEFAULTS.contains(jwtSecret)) {
                throw new IllegalStateException("FAIL-CLOSED: JWT secret is blank or set to a known insecure default in production!");
            }

            // 3. Verify Razorpay credentials
            String rzpKeyId = environment.getProperty("app.razorpay.key-id");
            if (!StringUtils.hasText(rzpKeyId) || INSECURE_DEFAULTS.contains(rzpKeyId)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key ID is blank or set to a known insecure default in production!");
            }
            String rzpKeySecret = environment.getProperty("app.razorpay.key-secret");
            if (!StringUtils.hasText(rzpKeySecret) || INSECURE_DEFAULTS.contains(rzpKeySecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key Secret is blank or set to a known insecure default in production!");
            }

            // 4. Verify Razorpay Webhook Secret
            String rzpWebhookSecret = environment.getProperty("app.razorpay.webhook-secret");
            if (!StringUtils.hasText(rzpWebhookSecret) || INSECURE_DEFAULTS.contains(rzpWebhookSecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Webhook Secret is blank or set to a known insecure default in production!");
            }

            // 5. Verify Shiprocket Webhook Token
            String srWebhookToken = environment.getProperty("sporekart.shiprocket.webhook-token");
            if (!StringUtils.hasText(srWebhookToken) || INSECURE_DEFAULTS.contains(srWebhookToken)) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket Webhook Token is blank or set to a known insecure default in production!");
            }

            // 6. Verify Database Credentials
            String dbPass = environment.getProperty("spring.datasource.password");
            if (!StringUtils.hasText(dbPass) || INSECURE_DEFAULTS.contains(dbPass)) {
                throw new IllegalStateException("FAIL-CLOSED: Database password is blank or set to a known insecure default in production!");
            }

            log.info("Production security configuration audit passed cleanly.");
        }
    }
}
