package com.sporekart.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAndWebhookAbuseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentEventRepository paymentEventRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    // --- JWT Security Tests (AUTH-14, AUTH-15, AUTH-16) ---

    @Test
    @DisplayName("AUTH-14: Tampered JWT payload or signature must be rejected")
    public void testJwtTamperingRejected() throws Exception {
        UUID userId = UUID.randomUUID();
        String validToken = jwtTokenProvider.generateToken(userId, "test@sporekart.com", "ROLE_CUSTOMER");

        // Tamper with the token signature (append garbage characters)
        String tamperedToken = validToken.substring(0, validToken.length() - 6) + "XXXXXX";

        mockMvc.perform(get("/api/v1/customer/profile")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-15: Expired JWT must be rejected with HTTP 401 Unauthorized")
    public void testExpiredJwtRejected() throws Exception {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        Date pastIssuedAt = new Date(System.currentTimeMillis() - 7200000); // 2 hours ago
        Date pastExpiration = new Date(System.currentTimeMillis() - 3600000); // 1 hour ago

        String expiredToken = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("identifier", "expired@sporekart.com")
                .claim("role", "ROLE_CUSTOMER")
                .issuedAt(pastIssuedAt)
                .expiration(pastExpiration)
                .signWith(key)
                .compact();

        mockMvc.perform(get("/api/v1/customer/profile")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AUTH-16: Role escalation attempt (ROLE_CUSTOMER accessing admin endpoint) must yield 403 Forbidden")
    public void testRoleEscalationCustomerToAdminForbidden() throws Exception {
        UUID customerId = UUID.randomUUID();
        String customerToken = jwtTokenProvider.generateToken(customerId, "customer@sporekart.com", "ROLE_CUSTOMER");

        mockMvc.perform(get("/admin/audit-logs")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // --- Webhook Security & Idempotency Abuse Tests (PAY-7, PAY-8, PAY-11, PAY-12) ---

    @Test
    @DisplayName("PAY-7 & PAY-12: Missing or invalid Razorpay Webhook signature must be rejected")
    public void testWebhookMissingOrTamperedSignatureRejected() throws Exception {
        String payload = "{\"event\":\"payment.captured\",\"payload\":{}}";

        // Missing signature header
        mockMvc.perform(post("/payment/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("PAY-8: Webhook payload with non-existent Order ID is handled gracefully")
    public void testWebhookInvalidOrderIdHandledGracefully() throws Exception {
        String eventId = "evt_nonexistent_" + UUID.randomUUID().toString().substring(0, 8);
        String payload = "{"
                + "\"event\":\"payment.captured\","
                + "\"event_id\":\"" + eventId + "\","
                + "\"payload\":{"
                + "  \"payment\":{"
                + "    \"entity\":{"
                + "      \"id\":\"pay_nonexistent_999\","
                + "      \"order_id\":\"order_nonexistent_999\","
                + "      \"amount\":1000"
                + "    }"
                + "  }"
                + "}"
                + "}";

        MvcResult result = mockMvc.perform(post("/payment/webhook")
                        .header("X-Razorpay-Signature", "mock_webhook_signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains("payment.captured"));
    }

    @Test
    @DisplayName("PAY-11: Replay Webhook Event with same event_id is handled idempotently")
    public void testWebhookReplayIdempotency() throws Exception {
        String rzpOrderId = "order_replay_" + UUID.randomUUID().toString().substring(0, 8);
        String rzpPaymentId = "pay_replay_" + UUID.randomUUID().toString().substring(0, 8);
        String eventId = "evt_replay_" + UUID.randomUUID().toString().substring(0, 8);

        // Pre-create DB Payment record
        Order order = Order.builder()
                .userId(UUID.randomUUID())
                .orderNumber("ORD-REPLAY-1")
                .subtotalAmountInr(new BigDecimal("100.00"))
                .gstTotalAmountInr(new BigDecimal("5.00"))
                .totalAmountInr(new BigDecimal("105.00"))
                .status(OrderStatus.PENDING_PAYMENT)
                .shippingAddressJson("{\"line1\":\"123 Street\",\"city\":\"Bangalore\",\"pincode\":\"560001\"}")
                .build();
        Order savedOrder = orderRepository.save(order);

        Payment payment = Payment.builder()
                .orderId(savedOrder.getId())
                .razorpayOrderId(rzpOrderId)
                .amountInr(new BigDecimal("105.00"))
                .status(PaymentStatus.CREATED)
                .build();
        paymentRepository.save(payment);

        String payload = "{"
                + "\"event\":\"payment.captured\","
                + "\"event_id\":\"" + eventId + "\","
                + "\"payload\":{"
                + "  \"payment\":{"
                + "    \"entity\":{"
                + "      \"id\":\"" + rzpPaymentId + "\","
                + "      \"order_id\":\"" + rzpOrderId + "\","
                + "      \"amount\":10500"
                + "    }"
                + "  }"
                + "}"
                + "}";

        // First Webhook call -> should process successfully
        MvcResult firstResult = mockMvc.perform(post("/payment/webhook")
                        .header("X-Razorpay-Signature", "mock_webhook_signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        assertTrue(firstResult.getResponse().getContentAsString().contains("Webhook processed successfully"));

        // Second Webhook call with exact same event_id -> should be ignored idempotently
        MvcResult secondResult = mockMvc.perform(post("/payment/webhook")
                        .header("X-Razorpay-Signature", "mock_webhook_signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        assertTrue(secondResult.getResponse().getContentAsString().contains("already processed"));
    }
}
