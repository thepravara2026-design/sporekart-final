package com.sporekart.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.identity.api.AuthDtos;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class SessionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Test
    @DisplayName("SEC-SESS-01: POST /auth/logout clears sporekart_token cookie with Max-Age=0 and HttpOnly")
    void testLogoutClearsCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/logout")
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookie, "Set-Cookie header must be present on logout");
        assertTrue(setCookie.contains("sporekart_token="), "Must target sporekart_token");
        assertTrue(setCookie.contains("Max-Age=0"), "Must set Max-Age=0 to expire cookie");
        assertTrue(setCookie.toLowerCase().contains("httponly"), "Must preserve HttpOnly flag");
        assertTrue(setCookie.contains("Path=/"), "Must preserve Path=/");
        assertTrue(setCookie.contains("SameSite=Lax"), "Must preserve SameSite=Lax");
    }

    @Test
    @DisplayName("SEC-SESS-02: Google login sets cookie max-age aligned to 24 hours (86400s)")
    void testGoogleLoginSets24HourCookie() throws Exception {
        AuthDtos.GoogleOAuthRequest request = AuthDtos.GoogleOAuthRequest.builder()
                .idToken("valid_test_token_sess@example.com")
                .email("sess@example.com")
                .fullName("Session Test User")
                .firstName("Session")
                .lastName("Test")
                .build();

        MvcResult result = mockMvc.perform(post("/auth/oauth/google")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookie, "Set-Cookie header must be present on login");
        assertTrue(setCookie.contains("Max-Age=86400"), "Cookie Max-Age must be 86400 seconds (24h)");
        assertTrue(setCookie.toLowerCase().contains("httponly"), "Cookie must be HttpOnly");
    }

    @Test
    @DisplayName("SEC-CSRF-01: Mutating request with cookie from untrusted Origin is blocked with 403")
    void testCsrfBlocksUntrustedOrigin() throws Exception {
        String token = tokenProvider.generateToken(UUID.randomUUID(), "csrf_victim@example.com", "ROLE_CUSTOMER");
        Cookie authCookie = new Cookie("sporekart_token", token);

        mockMvc.perform(post("/cart/clear")
                        .cookie(authCookie)
                        .header("Origin", "https://malicious-attacker-website.com")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-CSRF-02: Mutating request with cookie from trusted Origin succeeds")
    void testCsrfAllowsTrustedOrigin() throws Exception {
        String token = tokenProvider.generateToken(UUID.randomUUID(), "csrf_trusted@example.com", "ROLE_CUSTOMER");
        Cookie authCookie = new Cookie("sporekart_token", token);

        mockMvc.perform(post("/cart/clear")
                        .cookie(authCookie)
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}

