package com.sporekart.shared;

import com.sporekart.shared.infrastructure.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsAndHeadersSecurityTest {

    @Test
    void testProductionCorsExcludesLocalhostAndWildcard() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        SecurityConfig config = new SecurityConfig(null, null, null, null, prodEnv);
        // Set allowed origins containing localhost and wildcard to test fail-safe stripping
        org.springframework.test.util.ReflectionTestUtils.setField(
                config,
                "allowedOrigins",
                List.of("http://localhost:3000", "http://127.0.0.1:8080", "*", "https://sporekart.in", "https://sporekart.vercel.app")
        );

        CorsConfigurationSource source = config.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/products");
        CorsConfiguration cors = source.getCorsConfiguration(request);

        assertNotNull(cors);
        List<String> allowedOrigins = cors.getAllowedOrigins();
        assertNotNull(allowedOrigins);

        // Verify localhost and wildcards are strictly purged in production
        assertFalse(allowedOrigins.contains("http://localhost:3000"));
        assertFalse(allowedOrigins.contains("http://127.0.0.1:8080"));
        assertFalse(allowedOrigins.contains("*"));

        // Verify valid production origins are preserved
        assertTrue(allowedOrigins.contains("https://sporekart.in"));
        assertTrue(allowedOrigins.contains("https://sporekart.vercel.app"));
    }

    @Test
    void testDevProfileAllowsLocalhostCors() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        SecurityConfig config = new SecurityConfig(null, null, null, null, devEnv);
        CorsConfigurationSource source = config.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/products");
        CorsConfiguration cors = source.getCorsConfiguration(request);

        assertNotNull(cors);
        List<String> originPatterns = cors.getAllowedOriginPatterns();
        assertNotNull(originPatterns);
        assertTrue(originPatterns.contains("http://localhost:*"));
        assertTrue(originPatterns.contains("http://127.0.0.1:*"));
    }

    @Test
    void testExpiredAuthCookieClearsWithSecureFlagInProduction() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        com.sporekart.shared.infrastructure.JwtTokenProvider tokenProvider =
                org.mockito.Mockito.mock(com.sporekart.shared.infrastructure.JwtTokenProvider.class);
        org.mockito.Mockito.when(tokenProvider.validateToken("invalid.or.expired.jwt")).thenReturn(false);

        com.sporekart.shared.infrastructure.JwtAuthenticationFilter filter =
                new com.sporekart.shared.infrastructure.JwtAuthenticationFilter(tokenProvider, prodEnv);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/account/profile");
        request.setCookies(new jakarta.servlet.http.Cookie("sporekart_token", "invalid.or.expired.jwt"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        jakarta.servlet.FilterChain chain = org.mockito.Mockito.mock(jakarta.servlet.FilterChain.class);

        try {
            filter.doFilter(request, response, chain);
        } catch (Exception e) {
            org.junit.jupiter.api.Assertions.fail("Filter should handle request cleanly without exception: " + e.getMessage());
        }

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertNotNull(setCookieHeader);
        assertTrue(setCookieHeader.contains("sporekart_token="));
        assertTrue(setCookieHeader.toLowerCase().contains("secure"), "Production clear-cookie must include Secure flag");
        assertTrue(setCookieHeader.toLowerCase().contains("httponly"), "Production clear-cookie must include HttpOnly");
        assertTrue(setCookieHeader.contains("Max-Age=0"));
    }
}
