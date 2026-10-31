package com.sporekart.shared;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class InputValidationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("SEC-VAL-01: POST /create-order with negative amount returns 400 Bad Request")
    void testCreateOrderNegativeAmount() throws Exception {
        Map<String, Object> payload = Map.of(
                "amount", -500,
                "currency", "INR",
                "receipt", "rcpt_123"
        );

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-VAL-02: POST /create-order with amount under minimum 100 paise returns 400 Bad Request")
    void testCreateOrderUnderMinimumAmount() throws Exception {
        Map<String, Object> payload = Map.of(
                "amount", 50,
                "currency", "INR",
                "receipt", "rcpt_123"
        );

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-VAL-03: POST /verify-payment with missing signature returns 400 Bad Request")
    void testVerifyPaymentMissingSignature() throws Exception {
        Map<String, Object> payload = Map.of(
                "order_id", "order_123",
                "payment_id", "pay_123"
        );

        mockMvc.perform(post("/verify-payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-VAL-04: POST /payment/initiate with null orderId returns 400 Bad Request")
    void testPaymentInitiateNullOrderId() throws Exception {
        String payload = "{}";

        mockMvc.perform(post("/payment/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-VAL-05: POST /payment/verify with blank signature returns 400 Bad Request")
    void testPaymentVerifyBlankSignature() throws Exception {
        Map<String, Object> payload = Map.of(
                "orderId", UUID.randomUUID().toString(),
                "razorpayOrderId", "order_123",
                "razorpayPaymentId", "pay_123",
                "razorpaySignature", "   "
        );

        mockMvc.perform(post("/payment/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-VAL-06: POST /analytics/track-product-view with unbounded productTitle returns 400 Bad Request")
    void testTrackProductViewUnboundedTitle() throws Exception {
        String hugeTitle = "A".repeat(500); // Exceeds max=255
        Map<String, Object> payload = Map.of(
                "productId", UUID.randomUUID().toString(),
                "productSlug", "oyster-spawn",
                "productTitle", hugeTitle
        );

        mockMvc.perform(post("/analytics/track-product-view")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }
}

