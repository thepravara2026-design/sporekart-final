package com.sporekart.shared;

import com.sporekart.shared.infrastructure.RateLimitingFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class RateLimitingSecurityTest {

    @Test
    void testSpoofedXForwardedForIgnoredFromUntrustedSource() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of());
        FilterChain filterChain = mock(FilterChain.class);

        // Send 15 auth requests with different spoofed X-Forwarded-For headers from same remoteAddr "127.0.0.1"
        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus(), "Request " + i + " should pass under limit");
        }

        // 16th request from same remoteAddr with a new spoofed X-Forwarded-For must be blocked (429)
        MockHttpServletRequest request16 = new MockHttpServletRequest("POST", "/auth/login");
        request16.setRemoteAddr("127.0.0.1");
        request16.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse response16 = new MockHttpServletResponse();

        filter.doFilter(request16, response16, filterChain);
        assertEquals(429, response16.getStatus(), "16th request from untrusted remoteAddr must be rate limited despite spoofed X-Forwarded-For");
    }

    @Test
    void testXForwardedForTrustedFromConfiguredProxy() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(List.of("10.0.0.1"));
        FilterChain filterChain = mock(FilterChain.class);

        // Requests coming from trusted proxy 10.0.0.1 with distinct X-Forwarded-For headers should be treated as separate client IPs
        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("10.0.0.1");
            request.addHeader("X-Forwarded-For", "198.51.100." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, filterChain);
            assertEquals(200, response.getStatus());
        }

        // 16th request with a unique client IP behind trusted proxy should still be allowed (not rate limited)
        MockHttpServletRequest request16 = new MockHttpServletRequest("POST", "/auth/login");
        request16.setRemoteAddr("10.0.0.1");
        request16.addHeader("X-Forwarded-For", "198.51.100.250");
        MockHttpServletResponse response16 = new MockHttpServletResponse();

        filter.doFilter(request16, response16, filterChain);
        assertEquals(200, response16.getStatus(), "Request from new distinct IP behind trusted proxy should be allowed");
    }
}
