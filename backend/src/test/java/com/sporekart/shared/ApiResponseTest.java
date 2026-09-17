package com.sporekart.shared;

import com.sporekart.shared.api.ApiResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ApiResponseTest {

    @Test
    void testSuccessResponseStructure() {
        ApiResponse<String> response = ApiResponse.success("Hello Sporekart");

        assertTrue(response.isSuccess());
        assertEquals("Hello Sporekart", response.getData());
        assertNotNull(response.getRequestId());
        assertNull(response.getError());
    }

    @Test
    void testErrorResponseStructure() {
        ApiResponse<Void> response = ApiResponse.error("PRODUCT_NOT_FOUND", "Product was not found");

        assertFalse(response.isSuccess());
        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("PRODUCT_NOT_FOUND", response.getError().getCode());
        assertEquals("Product was not found", response.getError().getMessage());
        assertNotNull(response.getError().getRequestId());
    }
}
