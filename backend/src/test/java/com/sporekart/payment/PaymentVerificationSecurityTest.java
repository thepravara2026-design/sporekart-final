package com.sporekart.payment;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.shipping.api.ShippingDtos;
import com.sporekart.shipping.api.ShippingWebhookController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PaymentVerificationSecurityTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ShippingWebhookController shippingWebhookController;

    private final String dummyAddress = "{\"recipientName\":\"Test User\",\"phone\":\"+919999999999\",\"addressLine1\":\"123 Street\",\"city\":\"Bangalore\",\"state\":\"KA\",\"postalCode\":\"560001\"}";

    @Test
    @DisplayName("SEC-PAY-01: Payment verify without caller context throws ForbiddenOperationException")
    void testVerifyPayment_withoutCallerContext_throwsForbidden() {
        UUID ownerId = UUID.randomUUID();
        Order order = createTestOrder(ownerId, null, "ORD-OWNER-1", "order_rzp_111");
        createTestPayment(order.getId(), "order_rzp_111", new BigDecimal("500.00"));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId("order_rzp_111")
                .razorpayPaymentId("pay_mock_111")
                .razorpaySignature("mock_signature")
                .build();

        // Calling without caller context (callerUserId=null, callerSessionId=null)
        assertThrows(ForbiddenOperationException.class, () ->
                paymentService.verifyPayment(request, null, null)
        );
    }

    @Test
    @DisplayName("SEC-PAY-02: Payment verify with mismatched user ID throws ForbiddenOperationException")
    void testVerifyPayment_mismatchedUserId_throwsForbidden() {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        Order order = createTestOrder(ownerId, null, "ORD-OWNER-2", "order_rzp_222");
        createTestPayment(order.getId(), "order_rzp_222", new BigDecimal("500.00"));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId("order_rzp_222")
                .razorpayPaymentId("pay_mock_222")
                .razorpaySignature("mock_signature")
                .build();

        // Calling with attacker's user ID
        assertThrows(ForbiddenOperationException.class, () ->
                paymentService.verifyPayment(request, attackerId, null)
        );
    }

    @Test
    @DisplayName("SEC-PAY-03: Payment verify with mismatched guest session throws ForbiddenOperationException")
    void testVerifyPayment_mismatchedGuestSession_throwsForbidden() {
        String guestSessionId = "sess_original_12345";
        String attackerSessionId = "sess_attacker_99999";
        Order order = createTestOrder(null, guestSessionId, "ORD-GUEST-1", "order_rzp_333");
        createTestPayment(order.getId(), "order_rzp_333", new BigDecimal("500.00"));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId("order_rzp_333")
                .razorpayPaymentId("pay_mock_333")
                .razorpaySignature("mock_signature")
                .build();

        // Calling with mismatched guest session
        assertThrows(ForbiddenOperationException.class, () ->
                paymentService.verifyPayment(request, null, attackerSessionId)
        );
    }

    @Test
    @DisplayName("SEC-PAY-04: Payment verify with legitimate owner succeeds")
    void testVerifyPayment_matchingOwner_succeeds() {
        UUID ownerId = UUID.randomUUID();
        Order order = createTestOrder(ownerId, null, "ORD-OWNER-3", "order_rzp_444");
        createTestPayment(order.getId(), "order_rzp_444", new BigDecimal("500.00"));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId("order_rzp_444")
                .razorpayPaymentId("pay_mock_444")
                .razorpaySignature("mock_signature")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, ownerId, null);
        assertNotNull(response);
        assertTrue(response.isSuccess());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.PAID, updatedOrder.getStatus());
    }

    @Test
    @DisplayName("SEC-PAY-05: Webhook authoritative re-fetch with mismatched amount is rejected")
    void testWebhook_mismatchedAmount_rejected() {
        UUID ownerId = UUID.randomUUID();
        Order order = createTestOrder(ownerId, null, "ORD-HOOK-1", "order_rzp_hook_1");
        createTestPayment(order.getId(), "order_rzp_hook_1", new BigDecimal("500.00"));

        // pay_mock_mismatched_amount triggers TestPaymentGateway to report amountPaise = 1L (0.01 INR instead of 500.00 INR)
        String rawWebhookPayload = "{" +
                "\"event\":\"payment.captured\"," +
                "\"payload\":{" +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_mock_mismatched_amount\"," +
                "      \"order_id\":\"order_rzp_hook_1\"," +
                "      \"amount\":50000," +
                "      \"status\":\"captured\"" +
                "    }" +
                "  }" +
                "}}";

        assertThrows(IllegalArgumentException.class, () ->
                paymentService.processWebhook(rawWebhookPayload, "mock_webhook_signature")
        );

        Order freshOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertNotEquals(OrderStatus.PAID, freshOrder.getStatus(), "Order must NOT be marked PAID on amount mismatch");
    }

    @Test
    @DisplayName("SEC-SHIP-01: Shiprocket webhook fails closed (500) if configured token is blank")
    void testShiprocketWebhook_blankConfiguredToken_failsClosed() {
        ShippingWebhookController controller = new ShippingWebhookController(null);
        ReflectionTestUtils.setField(controller, "configuredWebhookToken", "   ");

        ShippingDtos.ShiprocketWebhookPayload payload = new ShippingDtos.ShiprocketWebhookPayload(
                "AWB123456", "DELIVERED", "Hub", "Delivered"
        );

        ResponseEntity<?> response = controller.handleShiprocketWebhook(payload, null, "any_token");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    @DisplayName("SEC-SHIP-02: Shiprocket webhook rejects invalid token with 401 Unauthorized")
    void testShiprocketWebhook_invalidToken_returnsUnauthorized() {
        ShippingDtos.ShiprocketWebhookPayload payload = new ShippingDtos.ShiprocketWebhookPayload(
                "AWB123456", "DELIVERED", "Hub", "Delivered"
        );

        ResponseEntity<?> response = shippingWebhookController.handleShiprocketWebhook(payload, null, "invalid_token_xyz");
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    private Order createTestOrder(UUID userId, String sessionId, String orderNumber, String razorpayOrderId) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .sessionId(sessionId)
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmountInr(new BigDecimal("500.00"))
                .subtotalAmountInr(new BigDecimal("500.00"))
                .gstTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson(dummyAddress)
                .razorpayOrderId(razorpayOrderId)
                .build();
        return orderRepository.save(order);
    }

    private Payment createTestPayment(UUID orderId, String razorpayOrderId, BigDecimal amountInr) {
        Payment payment = Payment.builder()
                .orderId(orderId)
                .razorpayOrderId(razorpayOrderId)
                .amountInr(amountInr)
                .currency("INR")
                .status(PaymentStatus.INITIATED)
                .build();
        return paymentRepository.save(payment);
    }
}
