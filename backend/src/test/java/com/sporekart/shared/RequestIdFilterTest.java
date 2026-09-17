package com.sporekart.shared;

import com.sporekart.shared.infrastructure.RequestIdContext;
import com.sporekart.shared.infrastructure.RequestIdFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    void testGeneratesNewRequestIdIfHeaderMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = (req, res) -> {
            assertNotNull(response.getHeader(RequestIdContext.REQUEST_ID_HEADER));
        };

        filter.doFilter(request, response, filterChain);

        String requestIdHeader = response.getHeader(RequestIdContext.REQUEST_ID_HEADER);
        assertNotNull(requestIdHeader);
        assertFalse(requestIdHeader.isBlank());
    }

    @Test
    void testPreservesIncomingRequestIdHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdContext.REQUEST_ID_HEADER, "custom-req-id-1234");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = (req, res) -> {};

        filter.doFilter(request, response, filterChain);

        assertEquals("custom-req-id-1234", response.getHeader(RequestIdContext.REQUEST_ID_HEADER));
    }
}
