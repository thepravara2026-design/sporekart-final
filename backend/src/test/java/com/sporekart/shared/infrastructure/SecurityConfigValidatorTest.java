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
        env.setProperty("app.razorpay.key-id", "rzp_live_real_id_12345");
        env.setProperty("app.razorpay.key-secret", "real_live_rzp_secret_67890");
        env.setProperty("app.razorpay.webhook-secret", "real_live_rzp_webhook_secret_11223");
        env.setProperty("sporekart.shiprocket.webhook-token", "real_live_shiprocket_token_99887");
        env.setProperty("spring.datasource.password", "super_secure_unique_db_password_44556");
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
}

