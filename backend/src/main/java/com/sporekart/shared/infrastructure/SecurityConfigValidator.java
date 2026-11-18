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
        boolean isStaging = environment.acceptsProfiles(Profiles.of("staging"));
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod", "production")) || (!isDevOrTest && !isStaging);

        if (isDevOrTest) {
            // Guard non-production environments against accidental live credential configuration
            String rzpKeyId = environment.getProperty("app.razorpay.key-id");
            if (StringUtils.hasText(rzpKeyId) && rzpKeyId.startsWith("rzp_live_")) {
                throw new IllegalStateException("FAIL-CLOSED: Live Razorpay key ('rzp_live_') is strictly prohibited in dev/test profiles to prevent accidental live charges!");
            }
        }

        if (isStaging) {
            log.info("Staging profile active - running fail-closed staging configuration audit...");

            // 1. Guard against live Razorpay keys in staging
            String rzpKeyId = environment.getProperty("app.razorpay.key-id");
            if (!StringUtils.hasText(rzpKeyId) || INSECURE_DEFAULTS.contains(rzpKeyId)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key ID is blank or set to an insecure default in staging!");
            }
            if (rzpKeyId.startsWith("rzp_live_")) {
                throw new IllegalStateException("FAIL-CLOSED: Live Razorpay key ('rzp_live_') is strictly prohibited in staging profile to prevent accidental live charges!");
            }
            if (!rzpKeyId.startsWith("rzp_test_")) {
                throw new IllegalStateException("FAIL-CLOSED: Staging requires a Razorpay test key starting with 'rzp_test_'!");
            }

            // 2. Verify Razorpay test secrets present
            String rzpKeySecret = environment.getProperty("app.razorpay.key-secret");
            if (!StringUtils.hasText(rzpKeySecret) || INSECURE_DEFAULTS.contains(rzpKeySecret) || isKnownPlaceholder(rzpKeySecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key Secret is blank or set to a placeholder in staging!");
            }
            String rzpWebhookSecret = environment.getProperty("app.razorpay.webhook-secret");
            if (!StringUtils.hasText(rzpWebhookSecret) || INSECURE_DEFAULTS.contains(rzpWebhookSecret) || isKnownPlaceholder(rzpWebhookSecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Webhook Secret is blank or set to a placeholder in staging!");
            }

            // 3. Verify JWT Secret (non-default, >= 32 chars)
            String jwtSecret = environment.getProperty("app.jwt.secret");
            if (!StringUtils.hasText(jwtSecret) || INSECURE_DEFAULTS.contains(jwtSecret) || jwtSecret.length() < 32) {
                throw new IllegalStateException("FAIL-CLOSED: JWT secret is blank or set to a known insecure default in staging! (must be at least 32 characters and non-default)");
            }

            // 4. Verify Database Credentials
            String dbPass = environment.getProperty("spring.datasource.password");
            if (!StringUtils.hasText(dbPass) || INSECURE_DEFAULTS.contains(dbPass)) {
                throw new IllegalStateException("FAIL-CLOSED: Database password is blank or set to a known insecure default in staging!");
            }

            // 5. Verify Google OAuth Client ID
            String googleClientId = environment.getProperty("spring.security.oauth2.client.registration.google.client-id");
            if (!StringUtils.hasText(googleClientId)) {
                googleClientId = environment.getProperty("GOOGLE_CLIENT_ID");
            }
            if (!StringUtils.hasText(googleClientId) || INSECURE_DEFAULTS.contains(googleClientId) || isKnownPlaceholder(googleClientId)) {
                throw new IllegalStateException("FAIL-CLOSED: Google OAuth Client ID is blank, missing, or set to a placeholder in staging!");
            }

            log.info("Staging security configuration audit passed cleanly.");
        }

        if (isProd) {
            log.info("Production profile active - running fail-closed security configuration audit...");

            // 1. Verify Razorpay Mock Mode is OFF
            String mockMode = environment.getProperty("app.razorpay.mock-mode");
            if ("true".equalsIgnoreCase(mockMode)) {
                throw new IllegalStateException("FAIL-CLOSED: app.razorpay.mock-mode must NOT be enabled in production!");
            }

            // 2. Verify JWT Secret
            String jwtSecret = environment.getProperty("app.jwt.secret");
            if (!StringUtils.hasText(jwtSecret) || INSECURE_DEFAULTS.contains(jwtSecret) || jwtSecret.length() < 32) {
                throw new IllegalStateException("FAIL-CLOSED: JWT secret is blank or set to a known insecure default in production! (must be at least 32 characters and non-default)");
            }

            // 3. Verify Razorpay credentials
            String rzpKeyId = environment.getProperty("app.razorpay.key-id");
            if (!StringUtils.hasText(rzpKeyId) || INSECURE_DEFAULTS.contains(rzpKeyId)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key ID is blank or set to a known insecure default in production!");
            }
            if (!rzpKeyId.matches("^rzp_live_[a-zA-Z0-9_]{10,30}$")) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key ID must be a live key matching format '^rzp_live_[a-zA-Z0-9]{14,24}$' in production! Test mode keys ('rzp_test_') are strictly rejected.");
            }
            String rzpKeySecret = environment.getProperty("app.razorpay.key-secret");
            if (!StringUtils.hasText(rzpKeySecret) || INSECURE_DEFAULTS.contains(rzpKeySecret) || rzpKeySecret.length() < 20
                    || isKnownPlaceholder(rzpKeySecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Key Secret is blank, under 20 chars, contains placeholder words, or set to a known insecure default in production!");
            }

            // 4. Verify Razorpay Webhook Secret
            String rzpWebhookSecret = environment.getProperty("app.razorpay.webhook-secret");
            if (!StringUtils.hasText(rzpWebhookSecret) || INSECURE_DEFAULTS.contains(rzpWebhookSecret) || rzpWebhookSecret.length() < 20
                    || isKnownPlaceholder(rzpWebhookSecret)) {
                throw new IllegalStateException("FAIL-CLOSED: Razorpay Webhook Secret is blank, under 20 chars, contains placeholder words, or set to a known insecure default in production!");
            }

            // 5. Verify Shiprocket Live Mode & Credentials
            String useRealShiprocket = environment.getProperty("sporekart.shiprocket.use-real-shiprocket");
            if (!"true".equalsIgnoreCase(useRealShiprocket)) {
                throw new IllegalStateException("FAIL-CLOSED: sporekart.shiprocket.use-real-shiprocket must be enabled in production! Mock shipping is prohibited.");
            }

            String srEmail = environment.getProperty("sporekart.shiprocket.email");
            if (!StringUtils.hasText(srEmail) || INSECURE_DEFAULTS.contains(srEmail)) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket email is blank or unconfigured in production!");
            }

            String srPassword = environment.getProperty("sporekart.shiprocket.password");
            if (!StringUtils.hasText(srPassword) || INSECURE_DEFAULTS.contains(srPassword)) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket password is blank or unconfigured in production!");
            }

            String srPickupLoc = environment.getProperty("sporekart.shiprocket.pickup-location");
            if (!StringUtils.hasText(srPickupLoc)) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket pickup location is blank or unconfigured in production!");
            }

            String srPickupPincode = environment.getProperty("sporekart.shiprocket.pickup-pincode");
            if (!StringUtils.hasText(srPickupPincode) || !srPickupPincode.matches("^[1-9][0-9]{5}$")) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket pickup pincode must be a valid 6-digit Indian pincode in production!");
            }

            String srWebhookToken = environment.getProperty("sporekart.shiprocket.webhook-token");
            if (!StringUtils.hasText(srWebhookToken) || INSECURE_DEFAULTS.contains(srWebhookToken)) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket Webhook Token is blank or set to a known insecure default in production!");
            }

            String srApiUrl = environment.getProperty("sporekart.shiprocket.api-url");
            if (StringUtils.hasText(srApiUrl) && !srApiUrl.startsWith("http")) {
                throw new IllegalStateException("FAIL-CLOSED: Shiprocket API URL must be a valid HTTP/HTTPS endpoint in production!");
            }

            // 6. Verify Database Credentials
            String dbPass = environment.getProperty("spring.datasource.password");
            if (!StringUtils.hasText(dbPass) || INSECURE_DEFAULTS.contains(dbPass)) {
                throw new IllegalStateException("FAIL-CLOSED: Database password is blank or set to a known insecure default in production!");
            }

            // 7. Verify Google OAuth Client ID (SEC-001)
            String googleClientId = environment.getProperty("spring.security.oauth2.client.registration.google.client-id");
            if (!StringUtils.hasText(googleClientId)) {
                googleClientId = environment.getProperty("GOOGLE_CLIENT_ID");
            }
            if (!StringUtils.hasText(googleClientId) || INSECURE_DEFAULTS.contains(googleClientId) || isKnownPlaceholder(googleClientId)) {
                throw new IllegalStateException("FAIL-CLOSED: Google OAuth Client ID is blank, missing, or set to a placeholder in production! Configure GOOGLE_CLIENT_ID.");
            }
            if (!googleClientId.contains(".apps.googleusercontent.com")) {
                throw new IllegalStateException("FAIL-CLOSED: Google OAuth Client ID format is invalid! Must contain '.apps.googleusercontent.com'.");
            }

            log.info("Production security configuration audit passed cleanly.");
        }
    }

    private boolean isKnownPlaceholder(String secret) {
        if (!StringUtils.hasText(secret)) return true;
        String s = secret.trim().toLowerCase();
        return s.equals("secret") || s.equals("secret123") || s.contains("your_secret")
                || s.contains("changeme") || s.contains("dummy") || s.contains("placeholder")
                || s.equals("mysecretkey") || s.equals("defaultsecret");
    }
}
