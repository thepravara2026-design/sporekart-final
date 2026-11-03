package com.sporekart.shared;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.GlobalExceptionHandler;
import com.sporekart.shared.infrastructure.RequestIdContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerSecurityTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        RequestIdContext.setCurrentRequestId("req-sec-audit-12345");
    }

    @AfterEach
    void tearDown() {
        RequestIdContext.clear();
    }

    @Test
    void testUnhandledGenericExceptionDoesNotLeakStackTraceOrInternalMessage() {
        Exception ex = new RuntimeException("CRITICAL: SELECT * FROM users WHERE password='raw_secret' failed in DB connection pool!");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        ApiResponse<Void> body = response.getBody();

        // Must NOT leak SQL, passwords, or class names
        assertFalse(body.getMessage().contains("SELECT"));
        assertFalse(body.getMessage().contains("password"));
        assertFalse(body.getMessage().contains("raw_secret"));
        assertFalse(body.getMessage().contains("RuntimeException"));

        // Must include safe message and correlation/request ID
        assertTrue(body.getMessage().contains("Internal server error"));
        assertTrue(body.getMessage().contains("req-sec-audit-12345"));
        assertEquals("req-sec-audit-12345", body.getRequestId());
        assertEquals("req-sec-audit-12345", body.getError().getRequestId());
        assertEquals("INTERNAL_SERVER_ERROR", body.getError().getCode());
    }

    @Test
    void testDatabaseAccessExceptionSanitizesSqlAndSchemaInfo() {
        DataAccessException ex = new DataAccessException("PSQLException: ERROR: relation \"app_secret_keys\" does not exist. Hint: Check schema 'public'") {};
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleDataAccessException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        ApiResponse<Void> body = response.getBody();

        // Must NOT leak database schema, relation name, or Postgres error details
        assertFalse(body.getMessage().contains("PSQLException"));
        assertFalse(body.getMessage().contains("app_secret_keys"));
        assertFalse(body.getMessage().contains("relation"));
        assertFalse(body.getMessage().contains("public"));

        // Must return safe generic message with reference ID
        assertTrue(body.getMessage().contains("Internal server error"));
        assertTrue(body.getMessage().contains("req-sec-audit-12345"));
        assertEquals("DATABASE_ERROR", body.getError().getCode());
        assertEquals("req-sec-audit-12345", body.getRequestId());
    }

    @Test
    void testAccessDeniedAndAuthExceptionsSanitizeInternalDetails() {
        AccessDeniedException denied = new AccessDeniedException("org.springframework.security.web.access.intercept.FilterSecurityInterceptor denied caller");
        ResponseEntity<ApiResponse<Void>> deniedResp = exceptionHandler.handleAccessDenied(denied);

        assertEquals(HttpStatus.FORBIDDEN, deniedResp.getStatusCode());
        assertEquals("Access Denied", deniedResp.getBody().getMessage());
        assertFalse(deniedResp.getBody().getMessage().contains("FilterSecurityInterceptor"));
        assertEquals("req-sec-audit-12345", deniedResp.getBody().getRequestId());

        AuthenticationException authEx = new AuthenticationException("BadCredentialsException: org.springframework.security.authentication.BadCredentialsException") {};
        ResponseEntity<ApiResponse<Void>> authResp = exceptionHandler.handleAuthenticationException(authEx);

        assertEquals(HttpStatus.UNAUTHORIZED, authResp.getStatusCode());
        assertEquals("Authentication failed", authResp.getBody().getMessage());
        assertFalse(authResp.getBody().getMessage().contains("org.springframework"));
        assertEquals("req-sec-audit-12345", authResp.getBody().getRequestId());
    }
}

