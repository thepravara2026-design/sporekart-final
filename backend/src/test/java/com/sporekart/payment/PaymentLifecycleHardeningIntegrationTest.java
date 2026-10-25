package com.sporekart.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.analytics.domain.events.OrderCreatedEvent;
import com.sporekart.analytics.domain.events.PaymentCapturedEvent;
import com.sporekart.notification.application.NotificationEventListener;
import com.sporekart.notification.application.NotificationEventService;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.RazorpayCheckoutController;
import com.sporekart.payment.api.RazorpayOrderDtos;
import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.payment.application.PaymentReconciliationService;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.application.RazorpayPaymentGateway;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.domain.Refund;
import com.sporekart.payment.domain.RefundStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.payment.infrastructure.RefundRepository;
import com.sporekart.wallet.application.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
public class PaymentLifecycleHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentReconciliationService reconciliationService;

    @Autowired
    private RazorpayCheckoutController checkoutController;

    @Autowired
    private NotificationEventListener notificationEventListener;

    @MockBean
    private NotificationEventService notificationEventService;

    @MockBean
    private WalletService walletService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        refundRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();

        String dummyAddress = "{\"recipientName\":\"Sunil Patil\",\"phone\":\"+919876543210\",\"addressLine1\":\"12 Krishi Marg\",\"city\":\"Pune\",\"state\":\"MH\",\"postalCode\":\"411005\"}";

        testOrder = Order.builder()
                .orderNumber("ORD-HARDEN-" + UUID.randomUUID().toString().substring(0, 6))
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmountInr(new BigDecimal("500.00"))
                .subtotalAmountInr(new BigDecimal("500.00"))
                .gstTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson(dummyAddress)
                .build();
        testOrder = orderRepository.save(testOrder);
    }

    @Test
    @DisplayName("DEF-01: createOrder rejects client-tampered amount mismatch with 400 Bad Request")
    void testCreateOrderWithMismatchedAmountIsRejected() throws Exception {
        RazorpayOrderDtos.CreateOrderRequest req = RazorpayOrderDtos.CreateOrderRequest.builder()
                .orderId(testOrder.getId())
                .amount(100L) // Client attempts to pay 100 paise (1 INR) for a 500 INR order
                .currency("INR")
                .receipt("rcpt_hack")
                .build();

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Amount mismatch with server order total"));
    }

    @Test
    @DisplayName("DEF-01: createOrder succeeds when amount matches server order total")
    void testCreateOrderWithCorrectAmountSucceeds() throws Exception {
        RazorpayOrderDtos.CreateOrderRequest req = RazorpayOrderDtos.CreateOrderRequest.builder()
                .orderId(testOrder.getId())
                .amount(50000L) // Exactly 500 INR
                .currency("INR")
                .receipt("rcpt_valid")
                .build();

        mockMvc.perform(post("/create-order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(50000))
                .andExpect(jsonPath("$.status").value("created"));

        Payment payment = paymentRepository.findByOrderId(testOrder.getId()).stream().findFirst().orElseThrow();
        assertEquals(PaymentStatus.INITIATED, payment.getStatus());
        assertEquals(0, new BigDecimal("500.00").compareTo(payment.getAmountInr()));
    }

    @Test
    @DisplayName("DEF-04: OrderCreatedEvent for PENDING_PAYMENT order does NOT dispatch premature ORDER_CONFIRMED")
    void testOrderCreatedEventDoesNotSendPrematureConfirmation() {
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderId(testOrder.getId())
                .orderNumber(testOrder.getOrderNumber())
                .totalAmountInr(testOrder.getTotalAmountInr())
                .build();

        notificationEventListener.handleOrderCreated(event);

        verify(notificationEventService, never()).recordEvent(
                eq(com.sporekart.notification.domain.NotificationEventType.ORDER_CONFIRMED),
                any(), any(), any(), any(), any(), any(), any(), any(), any()
        );
    }

    @Test
    @DisplayName("DEF-04: PaymentCapturedEvent dispatches ORDER_CONFIRMED notification once payment is confirmed")
    void testPaymentCapturedEventDispatchesOrderConfirmation() {
        testOrder.setStatus(OrderStatus.PAID);
        testOrder = orderRepository.save(testOrder);

        PaymentCapturedEvent event = PaymentCapturedEvent.builder()
                .orderId(testOrder.getId())
                .paymentId(UUID.randomUUID())
                .amountInr(new BigDecimal("500.00"))
                .razorpayPaymentId("pay_mock_confirmed")
                .build();

        notificationEventListener.handlePaymentCaptured(event);

        verify(notificationEventService, timeout(2000).times(1)).recordEvent(
                eq(com.sporekart.notification.domain.NotificationEventType.ORDER_CONFIRMED),
                eq("ORDER"),
                eq(testOrder.getId()),
                any(), any(), any(), any(), any(), any(), any()
        );
    }

    @Test
    @DisplayName("DEF-05 & DEF-06: refundPayment persists Refund entity and does not double-refund to wallet")
    void testRefundPaymentTracksRefundAndPreventsDoubleRefund() {
        testOrder.setStatus(OrderStatus.PAID);
        testOrder.setRazorpayPaymentId("pay_gateway_source123");
        testOrder = orderRepository.save(testOrder);

        Payment payment = Payment.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId("order_rzp_ref_test")
                .razorpayPaymentId("pay_gateway_source123")
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED)
                .build();
        paymentRepository.save(payment);

        // Process refund
        PaymentGateway.RefundResult result = paymentService.refundPayment(testOrder.getId(), new BigDecimal("500.00"), "Product return");

        assertNotNull(result);
        assertNotNull(result.getRefundId());

        // Assert Refund entity was created and tracked
        List<Refund> refunds = refundRepository.findByOrderId(testOrder.getId());
        assertEquals(1, refunds.size());
        Refund refund = refunds.get(0);
        assertEquals(new BigDecimal("500.00"), refund.getAmountInr());
        assertEquals(RefundStatus.PROCESSED, refund.getStatus());

        // Assert payment is marked REFUNDED
        Payment updatedPayment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, updatedPayment.getStatus());

        // Assert walletService.processRefundToWallet was NOT invoked for gateway refund (No double refund!)
        verify(walletService, never()).processRefundToWallet(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("DEF-06: Partial refund transitions Payment to PARTIALLY_REFUNDED and Order to REFUND_PENDING")
    void testPartialRefundTransitionsProperly() {
        testOrder.setStatus(OrderStatus.PAID);
        testOrder.setRazorpayPaymentId("pay_gateway_partial");
        testOrder = orderRepository.save(testOrder);

        Payment payment = Payment.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId("order_rzp_part_test")
                .razorpayPaymentId("pay_gateway_partial")
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED)
                .build();
        paymentRepository.save(payment);

        // Refund partial amount: 200 INR out of 500 INR
        PaymentGateway.RefundResult result = paymentService.refundPayment(testOrder.getId(), new BigDecimal("200.00"), "Partial damage refund");

        assertEquals(new BigDecimal("200.00"), result.getAmountInr());

        Payment updatedPayment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.PARTIALLY_REFUNDED, updatedPayment.getStatus());

        Order updatedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.REFUND_PENDING, updatedOrder.getStatus());

        // Remaining refundable is 300 INR. Attempting to refund 400 INR must fail
        assertThrows(IllegalArgumentException.class, () ->
                paymentService.refundPayment(testOrder.getId(), new BigDecimal("400.00"), "Excess refund attempt")
        );
    }

    @Test
    @DisplayName("DEF-07: payment.failed webhook does NOT overwrite already CAPTURED payment")
    void testPaymentFailedWebhookDoesNotOverwriteCapturedPayment() {
        Payment payment = Payment.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId("order_captured_web")
                .razorpayPaymentId("pay_captured_web")
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED)
                .build();
        payment = paymentRepository.save(payment);

        String failWebhook = "{\"event\":\"payment.failed\",\"event_id\":\"evt_fail_dup_1\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_captured_web\",\"id\":\"pay_captured_web\"}}}}";

        paymentService.processWebhook(failWebhook, "test_signature");

        Payment fresh = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.CAPTURED, fresh.getStatus(), "Payment status MUST remain CAPTURED");
    }

    @Test
    @DisplayName("DEF-09: Reconciliation job identifies stuck payment and marks as failed after expiration")
    void testReconciliationJobMarksExpiredPaymentFailed() {
        Payment expiredPayment = Payment.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId("order_stuck_expired")
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .createdAt(OffsetDateTime.now().minusHours(3))
                .updatedAt(OffsetDateTime.now().minusHours(3))
                .build();
        expiredPayment = paymentRepository.save(expiredPayment);

        PaymentReconciliationService.ReconciliationReport report =
                reconciliationService.reconcileStuckPayments(OffsetDateTime.now().minusMinutes(15));

        assertTrue(report.getPaymentsChecked() >= 1);
        assertTrue(report.getPaymentsFailed() >= 1);

        Payment fresh = paymentRepository.findById(expiredPayment.getId()).orElseThrow();
        assertEquals(PaymentStatus.FAILED, fresh.getStatus());
    }
}
