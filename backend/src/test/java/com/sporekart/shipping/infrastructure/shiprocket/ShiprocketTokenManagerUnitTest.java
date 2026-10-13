package com.sporekart.shipping.infrastructure.shiprocket;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ShiprocketTokenManagerUnitTest {

    @Test
    @DisplayName("TM-1: Successful login caches JWT token and reuses it for subsequent calls")
    void TM_1_getValidToken_successfulLoginAndCaching() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apiv2.shiprocket.in/v1/external");
        MockRestServiceServer mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient authRestClient = builder.build();

        ShiprocketTokenManager tokenManager = new ShiprocketTokenManager(
                "test@sporekart.in", "secret123", "https://apiv2.shiprocket.in/v1/external", authRestClient);

        String loginResponseJson = """
                {
                    "id": 9988,
                    "first_name": "Sporekart",
                    "last_name": "Admin",
                    "email": "test@sporekart.in",
                    "company_id": 12345,
                    "created_at": "2026-10-12 10:00:00",
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123"
                }
                """;

        mockServer.expect(requestTo("https://apiv2.shiprocket.in/v1/external/auth/login"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value("test@sporekart.in"))
                .andExpect(jsonPath("$.password").value("secret123"))
                .andRespond(withSuccess(loginResponseJson, MediaType.APPLICATION_JSON));

        // First call: fetches from remote and caches
        String token1 = tokenManager.getValidToken();
        assertEquals("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123", token1);
        mockServer.verify();

        // Second call: must return cached token without triggering another HTTP request
        String token2 = tokenManager.getValidToken();
        assertEquals(token1, token2);
        assertNotNull(tokenManager.getCachedToken());
        assertTrue(tokenManager.getTokenExpiresAt().isAfter(java.time.Instant.now()));
    }

    @Test
    @DisplayName("TM-2: Token invalidation forces a new login on the next call")
    void TM_2_invalidateToken_forcesReAuthentication() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apiv2.shiprocket.in/v1/external");
        MockRestServiceServer mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient authRestClient = builder.build();

        ShiprocketTokenManager tokenManager = new ShiprocketTokenManager(
                "test@sporekart.in", "secret123", "https://apiv2.shiprocket.in/v1/external", authRestClient);

        String loginResponse1 = "{\"id\": 1, \"token\": \"first_token_111\"}";
        String loginResponse2 = "{\"id\": 1, \"token\": \"second_token_222\"}";

        mockServer.expect(requestTo("https://apiv2.shiprocket.in/v1/external/auth/login"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(loginResponse1, MediaType.APPLICATION_JSON));

        String token1 = tokenManager.getValidToken();
        assertEquals("first_token_111", token1);
        mockServer.verify();

        // Invalidate
        mockServer.reset();
        tokenManager.invalidateToken();
        assertNull(tokenManager.getCachedToken());

        mockServer.expect(requestTo("https://apiv2.shiprocket.in/v1/external/auth/login"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(loginResponse2, MediaType.APPLICATION_JSON));

        String token2 = tokenManager.getValidToken();
        assertEquals("second_token_222", token2);
        mockServer.verify();
    }

    @Test
    @DisplayName("TM-3: Missing credentials immediately throws IllegalStateException without HTTP call")
    void TM_3_missingCredentials_throwsIllegalStateException() {
        RestClient.Builder builder = RestClient.builder();
        RestClient authRestClient = builder.build();

        ShiprocketTokenManager tokenManager = new ShiprocketTokenManager(
                "", "", "https://apiv2.shiprocket.in/v1/external", authRestClient);

        IllegalStateException ex = assertThrows(IllegalStateException.class, tokenManager::getValidToken);
        assertTrue(ex.getMessage().contains("Shiprocket credentials are not configured"));
    }

    @Test
    @DisplayName("TM-4: HTTP 401 on login wraps into ShiprocketApiException")
    void TM_4_unauthorizedLogin_throwsShiprocketApiException() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apiv2.shiprocket.in/v1/external");
        MockRestServiceServer mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient authRestClient = builder.build();

        ShiprocketTokenManager tokenManager = new ShiprocketTokenManager(
                "wrong@sporekart.in", "badpass", "https://apiv2.shiprocket.in/v1/external", authRestClient);

        mockServer.expect(requestTo("https://apiv2.shiprocket.in/v1/external/auth/login"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"message\": \"Invalid credentials\"}").contentType(MediaType.APPLICATION_JSON));

        ShiprocketApiException ex = assertThrows(ShiprocketApiException.class, tokenManager::getValidToken);
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("/auth/login", ex.getEndpoint());
        mockServer.verify();
    }
}
