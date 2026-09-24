package com.sporekart.shared;

import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JwtSecretSecurityTest {

    @Test
    void testValidateSecretFailsWhenBlankOrMissing() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class, provider::validateSecret);
        assertTrue(exception.getMessage().contains("JWT_SECRET"), "Exception message must reference missing/blank JWT_SECRET");
    }

    @Test
    void testValidateSecretFailsWhenTooShort() {
        JwtTokenProvider provider = new JwtTokenProvider();
        // Base64 of "too_short_secret" (only 16 bytes)
        ReflectionTestUtils.setField(provider, "jwtSecret", "dG9vX3Nob3J0X3NlY3JldA==");

        IllegalStateException exception = assertThrows(IllegalStateException.class, provider::validateSecret);
        assertTrue(exception.getMessage().contains("at least 32 bytes"), "Exception message must state 32 bytes minimum requirement");
    }

    @Test
    void testValidateSecretSucceedsWhenValid32BytesBase64() {
        JwtTokenProvider provider = new JwtTokenProvider();
        // 32-byte valid Base64 string
        ReflectionTestUtils.setField(provider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971");

        provider.validateSecret(); // Should complete without throwing exception
    }
}
