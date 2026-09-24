package com.sporekart.shared;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.shared.application.GlobalExceptionHandler;
import com.sporekart.shared.application.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

public class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    @Test
    void testHandleResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Product not found with id 123");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleResourceNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("NOT_FOUND", response.getBody().getError().getCode());
        assertEquals("Product not found with id 123", response.getBody().getError().getMessage());
    }

    @Test
    void testHandleForbiddenOperationException() {
        ForbiddenOperationException ex = new ForbiddenOperationException("Access denied: Not authorized");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleForbiddenOperation(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("FORBIDDEN", response.getBody().getError().getCode());
        assertEquals("Access denied: Not authorized", response.getBody().getError().getMessage());
    }
}
