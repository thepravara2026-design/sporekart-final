package com.sporekart.payment.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
public class RazorpayCheckoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Create Order: Missing or null amount returns 400 Bad Request")
    void testCreateOrderMissingAmountReturns400() throws Exception {
        Map<String, Object> req = new HashMap<>();
        req.put("currency", "INR");

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Create Order: Amount < 100 paise returns 400 Bad Request")
    void testCreateOrderAmountLessThan100Returns400() throws Exception {
        Map<String, Object> req = new HashMap<>();
        req.put("amount", 50); // 50 paise is < 100
        req.put("currency", "INR");

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Amount must be at least 100 paise"));
    }

    @Test
    @DisplayName("Create Order: Valid amount creates order and returns order_id, amount, and currency")
    void testCreateOrderValidAmountReturnsOrderDetails() throws Exception {
        Map<String, Object> req = new HashMap<>();
        req.put("amount", 50000); // 500 INR in paise
        req.put("currency", "INR");
        req.put("receipt", "test_receipt_01");

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.order_id").isNotEmpty())
                .andExpect(jsonPath("$.amount").value(50000))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    @DisplayName("Verify Payment: Missing fields returns 400 Bad Request")
    void testVerifyPaymentMissingFieldsReturns400() throws Exception {
        Map<String, Object> req = new HashMap<>();
        req.put("order_id", "order_test_123");
        // missing payment_id and signature

        mockMvc.perform(post("/verify-payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.verified").value(false));
    }

    @Test
    @DisplayName("Verify Payment: Invalid signature returns 400 Bad Request and does not mark as paid")
    void testVerifyPaymentInvalidSignatureReturns400() throws Exception {
        Map<String, Object> req = new HashMap<>();
        req.put("order_id", "order_test_123");
        req.put("payment_id", "pay_test_456");
        req.put("signature", "invalid_forged_signature_12345");

        mockMvc.perform(post("/verify-payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Signature mismatch"))
                .andExpect(jsonPath("$.verified").value(false));
    }
}
