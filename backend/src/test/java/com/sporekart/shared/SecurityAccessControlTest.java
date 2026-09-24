package com.sporekart.shared;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testAnalyticsFunnelRequiresAuth() throws Exception {
        mockMvc.perform(get("/analytics/funnel"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAnalyticsEventsRequiresAuth() throws Exception {
        mockMvc.perform(get("/analytics/events"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testPaymentRefundRequiresAuth() throws Exception {
        mockMvc.perform(post("/payment/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"00000000-0000-0000-0000-000000000000\",\"amountInr\":10.00}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testPublicTrackProductViewIsPermitted() throws Exception {
        mockMvc.perform(post("/analytics/track-product-view")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productSlug\":\"test-product\",\"productTitle\":\"Test Product\"}"))
                .andExpect(status().isOk());
    }
}
