package com.sporekart.order;

import com.sporekart.order.api.AdminOrderController;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.domain.Refund;
import com.sporekart.payment.domain.RefundStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.payment.infrastructure.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class OrderCancellationAndRefundLifecycleTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private AdminOrderController adminOrderController;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private PaymentService paymentService;

    private UUID customerId;
    private String guestSessionId;
    private UsernamePasswordAuthenticationToken adminAuth;

    @BeforeEach
    void setUp() {
        refundRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();

        customerId = UUID.randomUUID();
        guestSessionId = "sess_" + UUID.randomUUID().toString().substring(0, 8);

        UUID adminId = UUID.randomUUID();
        adminAuth = new UsernamePasswordAuthenticationToken(
                adminId.toString(),
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    private Order createOrder(String orderNumber, OrderStatus status, BigDecimal amount, String razorpayPaymentId, UUID userId, String sessionId) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .sessionId(sessionId)
                .status(status)
                .totalAmountInr(amount)
                .subtotalAmountInr(amount)
                .gstTotalAmountInr(BigDecimal.ZERO)
                .discountTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .razorpayOrderId("order_rzp_" + orderNumber.toLowerCase().replace("-", "_"))
                .razorpayPaymentId(razorpayPaymentId)
                .shippingAddressJson("{\"recipientName\":\"Test Customer\",\"phone\":\"9876543210\",\"line1\":\"Farm Rd\",\"city\":\"Pune\",\"state\":\"MH\",\"pincode\":\"411001\"}")
                .build();
        return orderRepository.save(order);
    }

    @Test
    @DisplayName("LIFECYCLE-01: Customer cancellation of unpaid order transitions to CANCELLED without initiating refunds")
    @Transactional
    void testCustomerCancellationOfUnpaidOrder() {
        Order order = createOrder("ORD-UNPAID-101", OrderStatus.PENDING_PAYMENT, new BigDecimal("1500.00"), null, customerId, null);

        OrderResponse response = orderService.cancelOrder(order.getId(), customerId, null, "Found cheaper elsewhere");

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());

        List<Refund> refunds = refundRepository.findByOrderId(order.getId());
        assertTrue(refunds.isEmpty(), "No refund record should be created for unpaid order cancellation");
    }

    @Test
    @DisplayName("LIFECYCLE-02: Customer cancellation of paid order initiates gateway refund and populates refund details")
    @Transactional
    void testCustomerCancellationOfPaidOrderWithRefund() {
        String paymentId = "pay_live_test_" + UUID.randomUUID().toString().substring(0, 8);
        Order order = createOrder("ORD-PAID-201", OrderStatus.PAID, new BigDecimal("2499.00"), paymentId, customerId, null);

        // Pre-create captured payment row
        Payment payment = Payment.builder()
                .orderId(order.getId())
                .razorpayOrderId(order.getRazorpayOrderId())
                .razorpayPaymentId(paymentId)
                .amountInr(new BigDecimal("2499.00"))
                .currency("INR")
                .status(PaymentStatus.CAPTURED)
                .build();
        paymentRepository.save(payment);

        OrderResponse response = orderService.cancelOrder(order.getId(), customerId, null, "Customer requested cancellation");

        assertNotNull(response);
        assertTrue(response.getStatus() == OrderStatus.REFUNDED || response.getStatus() == OrderStatus.REFUND_PENDING);

        List<Refund> refunds = refundRepository.findByOrderId(order.getId());
        assertFalse(refunds.isEmpty(), "Refund entity must be durably persisted");
        Refund savedRefund = refunds.get(0);
        assertEquals(new BigDecimal("2499.00"), savedRefund.getAmountInr());
        assertNotNull(savedRefund.getRazorpayRefundId());

        assertNotNull(response.getRefundStatus());
        assertNotNull(response.getRefundedAmountInr());
    }

    @Test
    @DisplayName("LIFECYCLE-03: Admin cancellation invokes full cancellation lifecycle with refund")
    @Transactional
    void testAdminCancellationViaDedicatedEndpoint() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        try {
            String paymentId = "pay_admin_test_" + UUID.randomUUID().toString().substring(0, 8);
            Order order = createOrder("ORD-ADMIN-301", OrderStatus.PAID, new BigDecimal("3200.00"), paymentId, customerId, null);

            Payment payment = Payment.builder()
                    .orderId(order.getId())
                    .razorpayOrderId(order.getRazorpayOrderId())
                    .razorpayPaymentId(paymentId)
                    .amountInr(new BigDecimal("3200.00"))
                    .currency("INR")
                    .status(PaymentStatus.CAPTURED)
                    .build();
            paymentRepository.save(payment);

            var adminResp = adminOrderController.cancelOrder(order.getId(), "Inventory stockout", adminAuth);

            assertNotNull(adminResp);
            assertNotNull(adminResp.getBody());
            assertTrue(adminResp.getBody().isSuccess());

            OrderResponse updated = adminResp.getBody().getData();
            assertTrue(updated.getStatus() == OrderStatus.REFUNDED || updated.getStatus() == OrderStatus.REFUND_PENDING);

            List<Refund> refunds = refundRepository.findByOrderId(order.getId());
            assertEquals(1, refunds.size(), "Admin cancellation must record durable refund");
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("LIFECYCLE-03B: Admin updateOrderStatus to CANCELLED converges on full cancellation lifecycle")
    @Transactional
    void testAdminUpdateOrderStatusToCancelledConvergesOnCancellationLifecycle() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        try {
            String paymentId = "pay_admin_status_" + UUID.randomUUID().toString().substring(0, 8);
            Order order = createOrder("ORD-ADMIN-302", OrderStatus.PAID, new BigDecimal("1250.00"), paymentId, customerId, null);

            Payment payment = Payment.builder()
                    .orderId(order.getId())
                    .razorpayOrderId(order.getRazorpayOrderId())
                    .razorpayPaymentId(paymentId)
                    .amountInr(new BigDecimal("1250.00"))
                    .currency("INR")
                    .status(PaymentStatus.CAPTURED)
                    .build();
            paymentRepository.save(payment);

            AdminOrderController.UpdateOrderStatusRequest request = new AdminOrderController.UpdateOrderStatusRequest();
            request.setStatus(OrderStatus.CANCELLED);
            request.setReason("Admin cancelled via status dropdown");

            var adminResp = adminOrderController.updateOrderStatus(order.getId(), request, adminAuth);

            assertNotNull(adminResp);
            assertNotNull(adminResp.getBody());
            assertTrue(adminResp.getBody().isSuccess());

            OrderResponse updated = adminResp.getBody().getData();
            assertTrue(updated.getStatus() == OrderStatus.REFUNDED || updated.getStatus() == OrderStatus.REFUND_PENDING);

            List<Refund> refunds = refundRepository.findByOrderId(order.getId());
            assertEquals(1, refunds.size(), "Admin status update to CANCELLED must trigger refund");
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("LIFECYCLE-07: Over-refund prevention: refund amount cannot exceed remaining eligible captured balance")
    @Transactional
    void testOverRefundPrevention() {
        String paymentId = "pay_over_test_" + UUID.randomUUID().toString().substring(0, 8);
        Order order = createOrder("ORD-OVER-701", OrderStatus.PAID, new BigDecimal("1000.00"), paymentId, customerId, null);

        Payment payment = Payment.builder()
                .orderId(order.getId())
                .razorpayOrderId(order.getRazorpayOrderId())
                .razorpayPaymentId(paymentId)
                .amountInr(new BigDecimal("1000.00"))
                .currency("INR")
                .status(PaymentStatus.CAPTURED)
                .build();
        paymentRepository.save(payment);

        // Attempting to refund ₹1500 on a ₹1000 captured order must be rejected
        assertThrows(IllegalArgumentException.class, () ->
                paymentService.refundPayment(order.getId(), new BigDecimal("1500.00"), "Excess refund attempt"));
    }

    @Test
    @DisplayName("LIFECYCLE-04: Cancellation idempotency: repeated cancellation requests return existing state without duplicate refunds")
    @Transactional
    void testCancellationIdempotencyOnRepeatedRequests() {
        String paymentId = "pay_idemp_test_" + UUID.randomUUID().toString().substring(0, 8);
        Order order = createOrder("ORD-IDEMP-401", OrderStatus.PAID, new BigDecimal("1800.00"), paymentId, customerId, null);

        Payment payment = Payment.builder()
                .orderId(order.getId())
                .razorpayOrderId(order.getRazorpayOrderId())
                .razorpayPaymentId(paymentId)
                .amountInr(new BigDecimal("1800.00"))
                .currency("INR")
                .status(PaymentStatus.CAPTURED)
                .build();
        paymentRepository.save(payment);

        // First cancellation
        OrderResponse firstResponse = orderService.cancelOrder(order.getId(), customerId, null, "Double click attempt 1");
        assertNotNull(firstResponse);

        int initialRefundCount = refundRepository.findByOrderId(order.getId()).size();
        assertEquals(1, initialRefundCount);

        // Second duplicate cancellation
        OrderResponse secondResponse = orderService.cancelOrder(order.getId(), customerId, null, "Double click attempt 2");
        assertNotNull(secondResponse);
        assertEquals(firstResponse.getStatus(), secondResponse.getStatus());

        // Assert no duplicate refund row was created
        int subsequentRefundCount = refundRepository.findByOrderId(order.getId()).size();
        assertEquals(initialRefundCount, subsequentRefundCount, "Duplicate cancellation must not create duplicate refund");
    }

    @Test
    @DisplayName("LIFECYCLE-05: Disallow cancellation once order is SHIPPED or DELIVERED")
    @Transactional
    void testDisallowCancellationOnceShippedOrDelivered() {
        Order shippedOrder = createOrder("ORD-SHIPPED-501", OrderStatus.SHIPPED, new BigDecimal("2000.00"), "pay_shipped_1", customerId, null);
        Order deliveredOrder = createOrder("ORD-DELIVERED-502", OrderStatus.DELIVERED, new BigDecimal("2000.00"), "pay_deliv_1", customerId, null);

        assertThrows(IllegalStateException.class, () ->
                orderService.cancelOrder(shippedOrder.getId(), customerId, null, "Cancel shipped order"));

        assertThrows(IllegalStateException.class, () ->
                orderService.cancelOrder(deliveredOrder.getId(), customerId, null, "Cancel delivered order"));
    }

    @Test
    @DisplayName("LIFECYCLE-06: Scenario G: Late payment verification for already cancelled order auto-initiates refund without reopening order")
    @Transactional
    void testScenarioGLatePaymentCapturedAfterCancellation() {
        String rzpOrderId = "order_late_rzp_" + UUID.randomUUID().toString().substring(0, 8);
        String rzpPaymentId = "pay_late_test_" + UUID.randomUUID().toString().substring(0, 8);

        Order order = createOrder("ORD-LATE-601", OrderStatus.PENDING_PAYMENT, new BigDecimal("999.00"), null, customerId, null);
        order.setRazorpayOrderId(rzpOrderId);
        orderRepository.save(order);

        // Customer cancels order before completing payment modal
        orderService.cancelOrder(order.getId(), customerId, null, "Cancelled while payment modal was open");
        Order cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());

        // Pre-create payment record associated with razorpayOrderId
        Payment payment = Payment.builder()
                .orderId(order.getId())
                .razorpayOrderId(rzpOrderId)
                .amountInr(new BigDecimal("999.00"))
                .currency("INR")
                .status(PaymentStatus.INITIATED)
                .build();
        paymentRepository.save(payment);

        // Late payment verification arrives
        PaymentDtos.VerifyPaymentRequest verifyRequest = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(rzpPaymentId)
                .razorpaySignature("mock_signature")
                .build();

        PaymentDtos.VerifyPaymentResponse verifyResponse = paymentService.verifyPayment(verifyRequest, customerId, null);

        assertNotNull(verifyResponse);
        // Verify payment response communicates late payment auto-refund to user
        assertFalse(verifyResponse.isSuccess());
        assertTrue(verifyResponse.getMessage().toLowerCase().contains("cancelled"));

        // Authoritative verification: Order MUST NOT be reopened to PAID
        Order finalOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertNotEquals(OrderStatus.PAID, finalOrder.getStatus());
        assertTrue(finalOrder.getStatus() == OrderStatus.CANCELLED || finalOrder.getStatus() == OrderStatus.REFUNDED || finalOrder.getStatus() == OrderStatus.REFUND_PENDING);

        // Auto-refund must be initiated
        List<Refund> refunds = refundRepository.findByOrderId(order.getId());
        assertFalse(refunds.isEmpty(), "Late payment on cancelled order must auto-trigger refund");
    }
}
