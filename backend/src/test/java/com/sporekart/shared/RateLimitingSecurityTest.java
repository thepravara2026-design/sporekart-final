package com.sporekart.shared;

import com.sporekart.shared.infrastructure.RateLimitingFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class RateLimitingSecurityTest {

    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filterChain = mock(FilterChain.class);
    }

    @Test
    void testSpoofedXForwardedForIgnoredFromUntrustedSource() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of()); // No trusted proxies configured

        // Send 30 auth requests with different spoofed X-Forwarded-For headers from same untrusted remoteAddr "127.0.0.1"
        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For", "203.0.113." + (i % 250));
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus(), "Request " + i + " should pass under limit");
        }

        // 31st request from same remoteAddr with a new spoofed X-Forwarded-For must be blocked (429)
        MockHttpServletRequest request31 = new MockHttpServletRequest("POST", "/auth/login");
        request31.setRemoteAddr("127.0.0.1");
        request31.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse response31 = new MockHttpServletResponse();

        filter.doFilter(request31, response31, filterChain);
        assertEquals(429, response31.getStatus(), "31st request from untrusted remoteAddr must be rate limited despite spoofed X-Forwarded-For");
        assertNotNull(response31.getHeader("Retry-After"), "Retry-After header must be present on 429 response");
        int retryAfter = Integer.parseInt(response31.getHeader("Retry-After"));
        assertTrue(retryAfter > 0 && retryAfter <= 60, "Retry-After must be between 1 and 60 seconds");
    }

    @Test
    void testXForwardedForTrustedFromConfiguredProxy() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of("10.0.0.1"));

        // Requests coming from trusted proxy 10.0.0.1 with distinct X-Forwarded-For headers should be treated as separate client IPs
        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("10.0.0.1");
            request.addHeader("X-Forwarded-For", "198.51.100." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus());
        }

        // 31st request with a new distinct client IP behind trusted proxy should still be allowed (not rate limited)
        MockHttpServletRequest request31 = new MockHttpServletRequest("POST", "/auth/login");
        request31.setRemoteAddr("10.0.0.1");
        request31.addHeader("X-Forwarded-For", "198.51.100.250");
        MockHttpServletResponse response31 = new MockHttpServletResponse();

        filter.doFilter(request31, response31, filterChain);
        assertEquals(200, response31.getStatus(), "Request from new distinct IP behind trusted proxy should be allowed");
    }

    @Test
    void testSensitiveEndpointsEnforce30PerMinuteLimit() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of());

        String[] sensitiveUris = {
                "/support/tickets",
                "/training/enroll",
                "/promocode/validate"
        };

        for (String uri : sensitiveUris) {
            filter.clearAll();
            for (int i = 0; i < 30; i++) {
                MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
                request.setRemoteAddr("192.0.2.1");
                MockHttpServletResponse response = new MockHttpServletResponse();
                filter.doFilter(request, response, filterChain);
                assertEquals(200, response.getStatus(), "Request " + i + " to " + uri + " should pass");
            }

            MockHttpServletRequest request31 = new MockHttpServletRequest("POST", uri);
            request31.setRemoteAddr("192.0.2.1");
            MockHttpServletResponse response31 = new MockHttpServletResponse();
            filter.doFilter(request31, response31, filterChain);
            assertEquals(429, response31.getStatus(), "31st request to " + uri + " must be rate limited");
            assertNotNull(response31.getHeader("Retry-After"));
        }
    }

    @Test
    void testInvalidIpInForwardedHeaderRejectedAndFallsBackToRemoteAddr() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of("10.0.0.1"));

        // Attacker sends malformed IP strings in X-Forwarded-For through trusted proxy
        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("10.0.0.1");
            request.addHeader("X-Forwarded-For", "malformed-ip-" + i + ", 1.2.3.4");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus());
        }

        // 31st request with another malformed IP string should fall back to 10.0.0.1 and get blocked
        MockHttpServletRequest request31 = new MockHttpServletRequest("POST", "/auth/login");
        request31.setRemoteAddr("10.0.0.1");
        request31.addHeader("X-Forwarded-For", "999.999.999.999, 1.2.3.4");
        MockHttpServletResponse response31 = new MockHttpServletResponse();

        filter.doFilter(request31, response31, filterChain);
        assertEquals(429, response31.getStatus(), "31st request with malformed forwarded IP must fall back to remoteAddr and be rate limited");
    }

    @Test
    void testCfConnectingIpHonoredWhenTrusted() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of("10.0.0.1"));

        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("10.0.0.1");
            request.addHeader("CF-Connecting-IP", "198.51.100.50");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus());
        }

        // 31st request from same CF-Connecting-IP must be blocked
        MockHttpServletRequest request31 = new MockHttpServletRequest("POST", "/auth/login");
        request31.setRemoteAddr("10.0.0.1");
        request31.addHeader("CF-Connecting-IP", "198.51.100.50");
        MockHttpServletResponse response31 = new MockHttpServletResponse();
        filter.doFilter(request31, response31, filterChain);
        assertEquals(429, response31.getStatus(), "CF-Connecting-IP must be rate limited after 30 requests");
    }
}
