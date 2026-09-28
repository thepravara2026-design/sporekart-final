package com.sporekart.payment.application;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.shared.application.ResourceNotFoundException;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.Batch;
import com.sporekart.training.domain.Course;
import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.domain.EnrollmentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceUnitTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private OrderService orderService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TrainingService trainingService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    @DisplayName("PAY-1: initiatePayment creates gateway order and saves INITIATED payment")
    void PAY_1_initiate_payment_success() {
        UUID orderId = UUID.randomUUID();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);
        orderResp.setOrderNumber("SK-1001");
        orderResp.setTotalAmountInr(new BigDecimal("999.00"));

        PaymentGateway.InitiatePaymentResult initResult = PaymentGateway.InitiatePaymentResult.builder()
                .razorpayOrderId("order_rzp_123")
                .amountInr(new BigDecimal("999.00"))
                .currency("INR")
                .razorpayKeyId("rzp_test_key")
                .orderId(orderId)
                .build();

        when(orderService.getOrderById(orderId)).thenReturn(orderResp);
        when(paymentGateway.createPaymentOrder(orderId, "SK-1001", new BigDecimal("999.00"))).thenReturn(initResult);

        PaymentDtos.InitiatePaymentResponse response = paymentService.initiatePayment(orderId);

        assertNotNull(response);
        assertEquals("order_rzp_123", response.getRazorpayOrderId());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(orderService, times(1)).setRazorpayOrderId(orderId, "order_rzp_123");
    }

    @Test
    @DisplayName("PAY-2: initiatePayment with missing order throws ResourceNotFoundException")
    void PAY_2_initiate_payment_missing_order_throws_resource_not_found() {
        UUID orderId = UUID.randomUUID();
        when(orderService.getOrderById(orderId)).thenThrow(new ResourceNotFoundException("Order not found"));

        assertThrows(ResourceNotFoundException.class, () -> paymentService.initiatePayment(orderId));
    }

    @Test
    @DisplayName("PAY-3: verifyPayment with valid signature updates status to CAPTURED and order to PAID")
    void PAY_3_verify_payment_success() {
        UUID orderId = UUID.randomUUID();
        String rzpOrderId = "order_rzp_100";
        String rzpPayId = "pay_rzp_200";
        String sig = "valid_sig_hash";

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .build();

        when(paymentGateway.verifySignature(rzpOrderId, rzpPayId, sig)).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId(rzpOrderId)).thenReturn(Optional.of(payment));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(rzpPayId)
                .razorpaySignature(sig)
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request);

        assertTrue(response.isSuccess());
        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());
        verify(orderService, times(1)).updateOrderStatus(orderId, OrderStatus.PAID, "Payment verified successfully", "PAYMENT_SERVICE");
        verify(orderService, times(1)).confirmOrderInventory(orderId);
        verify(eventPublisher, times(1)).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("PAY-4: verifyPayment with invalid signature marks payment FAILED")
    void PAY_4_verify_payment_invalid_signature_marks_failed() {
        UUID orderId = UUID.randomUUID();
        String rzpOrderId = "order_rzp_100";

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .build();

        when(paymentGateway.verifySignature(any(), any(), any())).thenReturn(false);
        when(paymentRepository.findByRazorpayOrderId(rzpOrderId)).thenReturn(Optional.of(payment));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId("pay_1")
                .razorpaySignature("bad_sig")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request);

        assertFalse(response.isSuccess());
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(orderService, never()).updateOrderStatus(any(), any(), any(), any());
    }

    @Test
    @DisplayName("PAY-5: verifyPayment with mismatched orderId throws IllegalArgumentException")
    void PAY_5_verify_payment_order_mismatch_throws_illegal_argument() {
        UUID orderA = UUID.randomUUID();
        UUID orderB = UUID.randomUUID();
        String rzpOrderA = "order_rzp_A";

        Payment paymentA = Payment.builder()
                .orderId(orderA)
                .razorpayOrderId(rzpOrderA)
                .build();

        when(paymentGateway.verifySignature(any(), any(), any())).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId(rzpOrderA)).thenReturn(Optional.of(paymentA));

        PaymentDtos.VerifyPaymentRequest fraudReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderB)
                .razorpayOrderId(rzpOrderA)
                .razorpayPaymentId("pay_1")
                .razorpaySignature("sig")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.verifyPayment(fraudReq)
        );

        assertTrue(ex.getMessage().contains("Mismatched order reference"));
    }

    @Test
    @DisplayName("PAY-6: verifyPayment with null orderId on payment entity throws IllegalArgumentException")
    void PAY_6_verify_payment_missing_order_association_throws_illegal_argument() {
        String rzpOrder = "order_rzp_null_order";
        Payment paymentWithoutOrder = Payment.builder()
                .orderId(null)
                .razorpayOrderId(rzpOrder)
                .build();

        when(paymentGateway.verifySignature(any(), any(), any())).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId(rzpOrder)).thenReturn(Optional.of(paymentWithoutOrder));

        PaymentDtos.VerifyPaymentRequest req = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(UUID.randomUUID())
                .razorpayOrderId(rzpOrder)
                .razorpayPaymentId("pay_1")
                .razorpaySignature("sig")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.verifyPayment(req)
        );
        assertTrue(ex.getMessage().contains("missing associated order ID"));
    }

    @Test
    @DisplayName("PAY-7: processWebhook for payment.captured updates payment and order")
    void PAY_7_process_webhook_captured_updates_payment_and_order() {
        String payload = "{\"event\":\"payment.captured\",\"event_id\":\"evt_100\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_rzp_web\",\"id\":\"pay_web_1\"}}}}";
        String sig = "valid_web_sig";

        UUID orderId = UUID.randomUUID();
        Payment payment = Payment.builder().orderId(orderId).razorpayOrderId("order_rzp_web").build();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);

        when(paymentGateway.verifyWebhookSignature(payload, sig)).thenReturn(true);
        when(paymentEventRepository.findByEventId("evt_100")).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_rzp_web")).thenReturn(Optional.of(payment));
        when(orderService.getOrderByRazorpayOrderId("order_rzp_web")).thenReturn(Optional.of(orderResp));

        String result = paymentService.processWebhook(payload, sig);

        assertTrue(result.contains("Webhook processed successfully"));
        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());
        verify(orderService, times(1)).updateOrderStatus(orderId, OrderStatus.PAID, "Payment captured via webhook", "RAZORPAY_WEBHOOK");
    }

    @Test
    @DisplayName("PAY-8: processWebhook with duplicate eventId returns idempotent ignore")
    void PAY_8_process_webhook_duplicate_event_id_idempotent_ignore() {
        String payload = "{\"event\":\"payment.captured\",\"event_id\":\"evt_dup_100\",\"payload\":{}}";
        String sig = "valid_web_sig";

        when(paymentGateway.verifyWebhookSignature(payload, sig)).thenReturn(true);
        when(paymentEventRepository.findByEventId("evt_dup_100")).thenReturn(Optional.of(new PaymentEvent()));

        String result = paymentService.processWebhook(payload, sig);

        assertTrue(result.contains("idempotent ignore"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("PAY-9: processWebhook with invalid signature throws IllegalArgumentException")
    void PAY_9_process_webhook_invalid_signature_throws_illegal_argument() {
        when(paymentGateway.verifyWebhookSignature(any(), any())).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.processWebhook("{}", "bad_sig")
        );
        assertTrue(ex.getMessage().contains("Invalid Razorpay webhook signature"));
    }

    @Test
    @DisplayName("PAY-10: processWebhook for payment.failed updates status to FAILED")
    void PAY_10_process_webhook_failed_event_marks_payment_failed() {
        String payload = "{\"event\":\"payment.failed\",\"event_id\":\"evt_fail_1\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_rzp_fail\",\"id\":\"pay_fail_1\"}}}}";
        String sig = "valid_sig";

        Payment payment = Payment.builder().razorpayOrderId("order_rzp_fail").status(PaymentStatus.INITIATED).build();

        when(paymentGateway.verifyWebhookSignature(payload, sig)).thenReturn(true);
        when(paymentEventRepository.findByEventId("evt_fail_1")).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_rzp_fail")).thenReturn(Optional.of(payment));

        String result = paymentService.processWebhook(payload, sig);

        assertTrue(result.contains("payment.failed"));
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
    }

    @Test
    @DisplayName("PAY-11: refundPayment invokes gateway refund and updates order and payment status")
    void PAY_11_refund_payment_success() {
        UUID orderId = UUID.randomUUID();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);
        orderResp.setRazorpayPaymentId("pay_rzp_refund_10");

        PaymentGateway.RefundResult refundResult = PaymentGateway.RefundResult.builder()
                .refundId("rfnd_100")
                .razorpayPaymentId("pay_rzp_refund_10")
                .amountInr(new BigDecimal("200.00"))
                .status("PROCESSED")
                .build();

        Payment payment = Payment.builder().razorpayPaymentId("pay_rzp_refund_10").status(PaymentStatus.CAPTURED).build();

        when(orderService.getOrderById(orderId)).thenReturn(orderResp);
        when(paymentGateway.refund("pay_rzp_refund_10", new BigDecimal("200.00"), "Damaged goods")).thenReturn(refundResult);
        when(paymentRepository.findByRazorpayPaymentId("pay_rzp_refund_10")).thenReturn(Optional.of(payment));

        PaymentGateway.RefundResult result = paymentService.refundPayment(orderId, new BigDecimal("200.00"), "Damaged goods");

        assertNotNull(result);
        assertEquals("rfnd_100", result.getRefundId());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(orderService, times(1)).updateOrderStatus(eq(orderId), eq(OrderStatus.REFUNDED), contains("rfnd_100"), eq("SYSTEM_REFUND"));
    }

    @Test
    @DisplayName("PAY-12: refundPayment on order without payment ID throws IllegalStateException")
    void PAY_12_refund_payment_missing_razorpay_payment_id_throws_illegal_state() {
        UUID orderId = UUID.randomUUID();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);
        orderResp.setRazorpayPaymentId(null);

        when(orderService.getOrderById(orderId)).thenReturn(orderResp);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.refundPayment(orderId, new BigDecimal("100.00"), "Cancel")
        );
        assertTrue(ex.getMessage().contains("Cannot refund order without payment ID"));
    }

    @Test
    @DisplayName("PAY-18: refundPayment with amount exceeding order total throws IllegalArgumentException")
    void PAY_18_refund_payment_exceeding_total_amount_throws_illegal_argument() {
        UUID orderId = UUID.randomUUID();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);
        orderResp.setRazorpayPaymentId("pay_rzp_excess_1");
        orderResp.setTotalAmountInr(new BigDecimal("500.00"));

        when(orderService.getOrderById(orderId)).thenReturn(orderResp);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.refundPayment(orderId, new BigDecimal("600.00"), "Excess refund attempt")
        );
        assertTrue(ex.getMessage().contains("cannot exceed total order amount"));
    }

    @Test
    @DisplayName("PAY-13: getPaymentSummary for ORDER type returns summary response")
    void PAY_13_get_payment_summary_order_success() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).userId(userId).status(OrderStatus.PENDING_PAYMENT).build();
        OrderResponse orderResp = new OrderResponse();
        orderResp.setId(orderId);
        orderResp.setOrderNumber("SK-SUMMARY-1");
        orderResp.setTotalAmountInr(new BigDecimal("1200.00"));
        orderResp.setStatus(OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderService.getOrderById(orderId)).thenReturn(orderResp);

        PaymentDtos.PaymentSummaryResponse summary = paymentService.getPaymentSummary("ORDER", orderId, userId, null);

        assertNotNull(summary);
        assertEquals("ORDER", summary.getType());
        assertEquals(new BigDecimal("1200.00"), summary.getAmountInr());
    }

    @Test
    @DisplayName("PAY-14: getPaymentSummary for ENROLLMENT type returns training summary response")
    void PAY_14_get_payment_summary_enrollment_success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Course course = Course.builder().title("Oyster Mushroom Course").build();
        Batch batch = Batch.builder().batchCode("BATCH-2026").build();
        Enrollment enrollment = Enrollment.builder()
                .id(enrollmentId)
                .userId(userId)
                .course(course)
                .batch(batch)
                .status(EnrollmentStatus.PENDING_PAYMENT)
                .feePaidInr(new BigDecimal("1500.00"))
                .build();

        when(trainingService.getEnrollmentById(enrollmentId)).thenReturn(enrollment);

        PaymentDtos.PaymentSummaryResponse summary = paymentService.getPaymentSummary("ENROLLMENT", enrollmentId, userId, null);

        assertNotNull(summary);
        assertEquals("ENROLLMENT", summary.getType());
        assertEquals("Oyster Mushroom Course", summary.getTitle());
        assertEquals(new BigDecimal("1500.00"), summary.getAmountInr());
    }

    @Test
    @DisplayName("PAY-15: getPaymentSummary for unauthorized user throws ForbiddenOperationException")
    void PAY_15_get_payment_summary_unauthorized_user_throws_forbidden() {
        UUID orderId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).userId(ownerId).build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenOperationException.class, () ->
                paymentService.getPaymentSummary("ORDER", orderId, attackerId, null)
        );
    }

    @Test
    @DisplayName("PAY-16: getPaymentSummary for guest with session mismatch throws ForbiddenOperationException")
    void PAY_16_get_payment_summary_guest_session_mismatch_throws_forbidden() {
        UUID orderId = UUID.randomUUID();
        Order guestOrder = Order.builder().id(orderId).userId(null).sessionId("sess-valid").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(guestOrder));

        assertThrows(ForbiddenOperationException.class, () ->
                paymentService.getPaymentSummary("ORDER", orderId, null, "sess-invalid")
        );
    }

    @Test
    @DisplayName("PAY-18: verifyEnrollmentPayment by legitimate owner saves Payment audit entry and confirms enrollment")
    void PAY_18_verify_enrollment_payment_legitimate_owner_success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Enrollment enrollment = Enrollment.builder()
                .id(enrollmentId)
                .userId(userId)
                .feePaidInr(new BigDecimal("2500.00"))
                .status(EnrollmentStatus.PENDING_PAYMENT)
                .build();

        Enrollment confirmedEnrollment = Enrollment.builder()
                .id(enrollmentId)
                .userId(userId)
                .feePaidInr(new BigDecimal("2500.00"))
                .status(EnrollmentStatus.CONFIRMED)
                .paymentReference("TXN-VALID-123")
                .build();

        when(trainingService.getEnrollmentById(enrollmentId)).thenReturn(enrollment);
        when(trainingService.confirmEnrollmentPayment(enrollmentId, "TXN-VALID-123")).thenReturn(confirmedEnrollment);

        PaymentDtos.VerifyEnrollmentPaymentRequest req = PaymentDtos.VerifyEnrollmentPaymentRequest.builder()
                .enrollmentId(enrollmentId)
                .paymentMethod("UPI")
                .transactionReference("TXN-VALID-123")
                .build();

        PaymentDtos.VerifyEnrollmentPaymentResponse resp = paymentService.verifyEnrollmentPayment(req, userId);

        assertNotNull(resp);
        assertTrue(resp.isSuccess());
        assertEquals("TXN-VALID-123", resp.getPaymentReference());
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }
}
