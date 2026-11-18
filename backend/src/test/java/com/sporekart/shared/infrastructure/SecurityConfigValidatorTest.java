package com.sporekart.shared.infrastructure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class SecurityConfigValidatorTest {

    private MockEnvironment createValidProdEnv() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.razorpay.mock-mode", "false");
        env.setProperty("app.jwt.secret", "valid_prod_jwt_secret_which_is_at_least_32_bytes_long_and_not_in_known_defaults");
        env.setProperty("app.razorpay.key-id", "rzp_live_998877665544332211");
        env.setProperty("app.razorpay.key-secret", "kX8vM2pL9qW4rT7yN1bV3cZ5");
        env.setProperty("app.razorpay.webhook-secret", "wP9vK3mL8qR2tY5nB7vC1zX4");
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "true");
        env.setProperty("sporekart.shiprocket.email", "live_shiprocket@sporekart.in");
        env.setProperty("sporekart.shiprocket.password", "secure_live_shiprocket_pass");
        env.setProperty("sporekart.shiprocket.pickup-location", "Davangere Central Warehouse");
        env.setProperty("sporekart.shiprocket.pickup-pincode", "577002");
        env.setProperty("sporekart.shiprocket.webhook-token", "real_live_shiprocket_token_99887");
        env.setProperty("sporekart.shiprocket.api-url", "https://apiv2.shiprocket.in/v1/external");
        env.setProperty("spring.datasource.password", "super_secure_unique_db_password_44556");
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com");
        return env;
    }

    @Test
    @DisplayName("Production validation passes when all required secrets are provided and non-default")
    void testValidProdSecretsPass() {
        MockEnvironment env = createValidProdEnv();
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        assertDoesNotThrow(validator::validateOnStartup);
    }

    @Test
    @DisplayName("PAY-CRIT-002: Production rejects Test Mode key")
    void PAY_CRIT_002_productionRejectsTestKey() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.key-id", "rzp_test_Tqs0MmdXUl8FRk");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("rzp_live_") || ex.getMessage().contains("insecure default"));
    }

    @Test
    @DisplayName("PAY-CRIT-003: Production accepts correctly configured Live Mode key format")
    void PAY_CRIT_003_productionAcceptsLiveKeyFormat() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.key-id", "rzp_live_998877665544332211");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        assertDoesNotThrow(validator::validateOnStartup);
    }

    @Test
    @DisplayName("SHIP-CRIT-003: Production refuses mock shipping mode")
    void SHIP_CRIT_003_productionRefusesMockShippingMode() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "false");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("sporekart.shiprocket.use-real-shiprocket must be enabled in production"));
    }

    @Test
    @DisplayName("SHIP-CRIT-004: Production refuses missing email")
    void SHIP_CRIT_004_productionRefusesMissingEmail() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("sporekart.shiprocket.email", "");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Shiprocket email is blank"));
    }

    @Test
    @DisplayName("SHIP-CRIT-005: Production refuses missing password")
    void SHIP_CRIT_005_productionRefusesMissingPassword() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("sporekart.shiprocket.password", "");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Shiprocket password is blank"));
    }

    @Test
    @DisplayName("SHIP-CRIT-006: Production refuses missing pickup configuration")
    void SHIP_CRIT_006_productionRefusesMissingPickupConfig() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("sporekart.shiprocket.pickup-location", "");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("pickup location is blank"));

        MockEnvironment env2 = createValidProdEnv();
        env2.setProperty("sporekart.shiprocket.pickup-pincode", "INVALID");
        SecurityConfigValidator validator2 = new SecurityConfigValidator(env2);
        IllegalStateException ex2 = assertThrows(IllegalStateException.class, validator2::validateOnStartup);
        assertTrue(ex2.getMessage().contains("pickup pincode"));
    }

    @Test
    @DisplayName("Production startup fails closed when mock-mode is enabled")
    void testFailClosedWhenMockModeEnabledInProd() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.mock-mode", "true");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("mock-mode must NOT be enabled in production"));
    }

    @Test
    @DisplayName("Production startup fails closed when JWT secret is a known insecure default")
    void testFailClosedWhenJwtSecretIsInsecureDefault() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.jwt.secret", "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("JWT secret is blank or set to a known insecure default"));
    }

    @Test
    @DisplayName("Production startup fails closed when database password is empty or default")
    void testFailClosedWhenDbPasswordIsDefault() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("spring.datasource.password", "MyDbSporekart@123#");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Database password is blank or set to a known insecure default"));
    }

    @Test
    @DisplayName("Dev and test profiles bypass strict production checks")
    void testDevAndTestProfilesBypassProdAudit() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("app.razorpay.mock-mode", "true");
        env.setProperty("spring.datasource.password", "fake_dev");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        assertDoesNotThrow(validator::validateOnStartup);
    }

    @Test
    @DisplayName("H-04: Test and dev profiles strictly forbid live Razorpay key")
    void testAndDevProfilesRejectLiveRazorpayKey() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");
        env.setProperty("app.razorpay.key-id", "rzp_live_998877665544332211");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Live Razorpay key ('rzp_live_') is strictly prohibited in dev/test profiles"));
    }

    @Test
    @DisplayName("H-04: Production rejects weak or placeholder Razorpay secret")
    void productionRejectsWeakOrPlaceholderRazorpaySecret() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.key-secret", "your_secret_here_123");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Razorpay Key Secret is blank, under 20 chars, contains placeholder words"));
    }

    @Test
    @DisplayName("SEC-001: Production fails closed when Google Client ID is missing or blank")
    void testFailClosedWhenGoogleClientIdIsMissing() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Google OAuth Client ID is blank, missing, or set to a placeholder"));
    }

    @Test
    @DisplayName("SEC-001: Production fails closed when Google Client ID is placeholder")
    void testFailClosedWhenGoogleClientIdIsPlaceholder() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "your_client_id_placeholder");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Google OAuth Client ID is blank, missing, or set to a placeholder"));
    }

    @Test
    @DisplayName("SEC-001: Production fails closed when Google Client ID does not contain .apps.googleusercontent.com")
    void testFailClosedWhenGoogleClientIdFormatInvalid() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "invalid_client_id_without_domain");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Google OAuth Client ID format is invalid"));
    }

    private MockEnvironment createValidStagingEnv() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("staging");
        env.setProperty("app.jwt.secret", "valid_staging_jwt_secret_which_is_at_least_32_bytes_long_unique");
        env.setProperty("app.razorpay.key-id", "rzp_test_stagingKey998877");
        env.setProperty("app.razorpay.key-secret", "staging_secret_key_non_placeholder_2026");
        env.setProperty("app.razorpay.webhook-secret", "staging_webhook_secret_key_non_placeholder_2026");
        env.setProperty("spring.datasource.password", "super_secure_staging_db_password_44556");
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "1234567890-staging.apps.googleusercontent.com");
        return env;
    }

    @Test
    @DisplayName("STG-001: Staging validation passes with test keys and secure non-defaults")
    void testValidStagingSecretsPass() {
        MockEnvironment env = createValidStagingEnv();
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        assertDoesNotThrow(validator::validateOnStartup);
    }

    @Test
    @DisplayName("STG-002: Staging strictly rejects live Razorpay keys to prevent accidental live charges")
    void stagingProfileRejectsLiveRazorpayKey() {
        MockEnvironment env = createValidStagingEnv();
        env.setProperty("app.razorpay.key-id", "rzp_live_998877665544332211");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Live Razorpay key ('rzp_live_') is strictly prohibited in staging profile"));
    }

    @Test
    @DisplayName("STG-003: Staging rejects non-test key format")
    void stagingProfileRejectsNonTestKeyFormat() {
        MockEnvironment env = createValidStagingEnv();
        env.setProperty("app.razorpay.key-id", "invalid_custom_key_123");
        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Staging requires a Razorpay test key starting with 'rzp_test_'"));
    }
}

