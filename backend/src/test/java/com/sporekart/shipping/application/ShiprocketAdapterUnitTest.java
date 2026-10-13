package com.sporekart.shipping.application;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShiprocketAdapterUnitTest {

    @Test
    @DisplayName("ADAPT-1: Default configuration always enforces mock mode")
    void ADAPT_1_default_isMockMode() {
        ShiprocketAdapter adapter = new ShiprocketAdapter();
        // Defaults: useRealShiprocket = false
        assertTrue(adapter.isMockMode(), "Must be in mock mode when toggle is false");
    }

    @Test
    @DisplayName("ADAPT-2: Live credentials without explicit toggle true remains in mock mode")
    void ADAPT_2_credentialsPresentWithoutToggle_isMockMode() {
        ShiprocketAdapter adapter = new ShiprocketAdapter();
        ReflectionTestUtils.setField(adapter, "email", "live@sporekart.in");
        ReflectionTestUtils.setField(adapter, "password", "SuperSecretLivePass123");
        ReflectionTestUtils.setField(adapter, "useRealShiprocket", false);

        assertTrue(adapter.isMockMode(), "Must remain in mock mode when useRealShiprocket is false even with credentials");
    }

    @Test
    @DisplayName("ADAPT-3: Live credentials with explicit toggle true activates live mode")
    void ADAPT_3_credentialsWithToggleTrue_isLiveMode() {
        ShiprocketAdapter adapter = new ShiprocketAdapter();
        ReflectionTestUtils.setField(adapter, "email", "live@sporekart.in");
        ReflectionTestUtils.setField(adapter, "password", "SuperSecretLivePass123");
        ReflectionTestUtils.setField(adapter, "useRealShiprocket", true);

        assertFalse(adapter.isMockMode(), "Must switch to live mode when toggle is explicitly true and credentials present");
    }
}
