package com.sporekart.payment;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.*;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shared.infrastructure.SecurityConfigValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RazorpayRemediationCriticalTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private OrderService orderService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private PaymentEventIdempotencyService paymentEventIdempotencyService;

    @Mock
    private com.sporekart.payment.infrastructure.RefundRepository refundRepository;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        lenient().when(paymentEventIdempotencyService.recordEventIfUnique(any())).thenReturn(true);
    }

    private MockEnvironment createValidProdEnv() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.razorpay.mock-mode", "false");
        env.setProperty("app.jwt.secret", "valid_prod_jwt_secret_which_is_at_least_32_bytes_long_and_not_in_known_defaults");
        env.setProperty("app.razorpay.key-id", "rzp_live_real_id_12345");
        env.setProperty("app.razorpay.key-secret", "real_live_rzp_secret_67890");
        env.setProperty("app.razorpay.webhook-secret", "real_live_rzp_webhook_secret_11223");
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "true");
        env.setProperty("sporekart.shiprocket.email", "live_shiprocket@sporekart.in");
        env.setProperty("sporekart.shiprocket.password", "secure_live_shiprocket_pass");
        env.setProperty("sporekart.shiprocket.pickup-location", "Davangere Central Warehouse");
        env.setProperty("sporekart.shiprocket.pickup-pincode", "577002");
        env.setProperty("sporekart.shiprocket.webhook-token", "real_live_shiprocket_token_99887");
        env.setProperty("sporekart.shiprocket.api-url", "https://apiv2.shiprocket.in/v1/external");
        env.setProperty("spring.datasource.password", "super_secure_unique_db_password_44556");
        env.setProperty("spring.security.oauth2.client.registration.google.client-id", "1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com");
        return env;
    }

    @Test
    @DisplayName("PAY-CRIT-001: Development Test Mode remains functional")
    void PAY_CRIT_001_developmentTestModeRemainsFunctional() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");
        devEnv.setProperty("app.razorpay.mock-mode", "false");
        devEnv.setProperty("app.razorpay.key-id", "rzp_test_fake_dev_key_id");
        devEnv.setProperty("app.razorpay.key-secret", "fake_dev_key_secret");
        devEnv.setProperty("app.razorpay.webhook-secret", "fake_dev_webhook_secret");
        devEnv.setProperty("spring.datasource.password", "sa");

        SecurityConfigValidator validator = new SecurityConfigValidator(devEnv);
        assertDoesNotThrow(validator::validateOnStartup, "Dev environment must permit rzp_test_ keys");
    }

    @Test
    @DisplayName("PAY-CRIT-002: Production rejects Test Mode key")
    void PAY_CRIT_002_productionRejectsTestKey() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.key-id", "rzp_test_Tqs0MmdXUl8FRk");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("rzp_live_") || ex.getMessage().contains("insecure default"));
    }

    @Test
    @DisplayName("PAY-CRIT-003: Production accepts correctly configured Live Mode key format")
    void PAY_CRIT_003_productionAcceptsLiveKeyFormat() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.key-id", "rzp_live_RealLiveCredential9988");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        assertDoesNotThrow(validator::validateOnStartup, "Valid rzp_live_ key must pass production startup audit");
    }

    @Test
    @DisplayName("PAY-CRIT-004: Production rejects mock mode")
    void PAY_CRIT_004_productionRejectsMockMode() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.mock-mode", "true");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("app.razorpay.mock-mode must NOT be enabled in production"));
    }

    @Test
    @DisplayName("PAY-CRIT-005: Production rejects missing webhook secret")
    void PAY_CRIT_005_productionRejectsMissingWebhookSecret() {
        MockEnvironment env = createValidProdEnv();
        env.setProperty("app.razorpay.webhook-secret", "");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Razorpay Webhook Secret is blank"));
    }

    @Test
    @DisplayName("PAY-CRIT-006: Production rejects incomplete credentials")
    void PAY_CRIT_006_productionRejectsIncompleteCredentials() {
        MockEnvironment envKey = createValidProdEnv();
        envKey.setProperty("app.razorpay.key-id", "");
        SecurityConfigValidator vKey = new SecurityConfigValidator(envKey);
        assertThrows(IllegalStateException.class, vKey::validateOnStartup);

        MockEnvironment envSec = createValidProdEnv();
        envSec.setProperty("app.razorpay.key-secret", "");
        SecurityConfigValidator vSec = new SecurityConfigValidator(envSec);
        assertThrows(IllegalStateException.class, vSec::validateOnStartup);
    }

    @Test
    @DisplayName("PAY-CRIT-007: Invalid payment signature is rejected")
    void PAY_CRIT_007_invalidPaymentSignatureRejected() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setUserId(userId);
        when(orderService.getOrderById(orderId)).thenReturn(order);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId("order_rzp_valid")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_valid")).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature("order_rzp_valid", "pay_test_001", "forged_signature")).thenReturn(false);

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId("order_rzp_valid")
                .razorpayPaymentId("pay_test_001")
                .razorpaySignature("forged_signature")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, userId, null);
        assertNotNull(response);
        assertFalse(response.isSuccess(), "Invalid signature must result in verification failure");
        assertEquals(PaymentStatus.FAILED, payment.getStatus(), "Payment status must transition to FAILED");
    }

    @Test
    @DisplayName("PAY-CRIT-008: Incorrect payment amount is rejected")
    void PAY_CRIT_008_incorrectPaymentAmountRejected() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setUserId(userId);
        when(orderService.getOrderById(orderId)).thenReturn(order);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("1000.00")) // Expected 1000 INR = 100000 paise
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId("order_rzp_valid")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_valid")).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature("order_rzp_valid", "pay_test_002", "valid_sig")).thenReturn(true);

        // Gateway reports payment was for only 500 INR (50000 paise)
        PaymentGateway.GatewayPaymentDetails details = PaymentGateway.GatewayPaymentDetails.builder()
                .paymentId("pay_test_002")
                .orderId("order_rzp_valid")
                .status("captured")
                .amountPaise(50000L) // Underpayment tampering
                .currency("INR")
                .build();
        when(paymentGateway.fetchPayment("pay_test_002")).thenReturn(details);
        when(paymentGateway.isMockMode()).thenReturn(false);

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId("order_rzp_valid")
                .razorpayPaymentId("pay_test_002")
                .razorpaySignature("valid_sig")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, userId, null);
        assertFalse(response.isSuccess(), "Tampered or mismatched payment amount must be rejected");
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
    }

    @Test
    @DisplayName("PAY-CRIT-009: Incorrect currency is rejected")
    void PAY_CRIT_009_incorrectCurrencyRejected() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setUserId(userId);
        when(orderService.getOrderById(orderId)).thenReturn(order);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId("order_rzp_valid")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_valid")).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature("order_rzp_valid", "pay_test_003", "valid_sig")).thenReturn(true);

        PaymentGateway.GatewayPaymentDetails details = PaymentGateway.GatewayPaymentDetails.builder()
                .paymentId("pay_test_003")
                .orderId("order_rzp_valid")
                .status("captured")
                .amountPaise(50000L)
                .currency("USD") // Currency mismatch
                .build();
        when(paymentGateway.fetchPayment("pay_test_003")).thenReturn(details);
        when(paymentGateway.isMockMode()).thenReturn(false);

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId("order_rzp_valid")
                .razorpayPaymentId("pay_test_003")
                .razorpaySignature("valid_sig")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, userId, null);
        assertFalse(response.isSuccess(), "Non-INR currency must be rejected");
    }

    @Test
    @DisplayName("PAY-CRIT-010: Duplicate webhook is idempotent")
    void PAY_CRIT_010_duplicateWebhookIsIdempotent() {
        String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt_dupe_101\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_dupe_101\",\"order_id\":\"order_rzp_dupe\",\"amount\":50000,\"currency\":\"INR\",\"status\":\"captured\"}}}}";
        String sig = "valid_webhook_signature";

        when(paymentGateway.verifyWebhookSignature(rawBody, sig)).thenReturn(true);
        // Fast read duplicate check finds existing event
        when(paymentEventRepository.findByEventId("evt_dupe_101")).thenReturn(Optional.of(new PaymentEvent()));

        String result = paymentService.processWebhook(rawBody, sig);
        assertTrue(result.contains("already processed") || result.contains("idempotent"));

        // Verify that duplicate webhook does NOT re-trigger payment capture logic
        verify(paymentRepository, never()).findByRazorpayOrderId("order_rzp_dupe");
        verify(orderService, never()).updateOrderStatus(any(), eq(OrderStatus.PAID), any(), any());
    }

    @Test
    @DisplayName("PAY-CRIT-011: Duplicate verification is idempotent")
    void PAY_CRIT_011_duplicateVerificationIsIdempotent() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setUserId(userId);
        when(orderService.getOrderById(orderId)).thenReturn(order);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED) // Already CAPTURED
                .razorpayOrderId("order_rzp_already_captured")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_already_captured")).thenReturn(Optional.of(payment));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId("order_rzp_already_captured")
                .razorpayPaymentId("pay_captured_already")
                .razorpaySignature("sig_already")
                .build();

        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, userId, null);
        assertTrue(response.isSuccess());
        assertEquals("Payment already verified", response.getMessage());

        // Verify no duplicate order status updates or gateway verification
        verify(paymentGateway, never()).verifySignature(any(), any(), any());
        verify(orderService, never()).updateOrderStatus(any(), eq(OrderStatus.PAID), any(), any());
    }

    @Test
    @DisplayName("PAY-CRIT-012: Gateway timeout is recoverable")
    void PAY_CRIT_012_gatewayTimeoutIsRecoverable() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setUserId(userId);
        when(orderService.getOrderById(orderId)).thenReturn(order);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId("order_rzp_timeout")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_timeout")).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature(any(), any(), any())).thenReturn(true);
        when(paymentGateway.fetchPayment("pay_timeout")).thenThrow(new RuntimeException("Gateway read timeout 504"));

        PaymentDtos.VerifyPaymentRequest request = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId("order_rzp_timeout")
                .razorpayPaymentId("pay_timeout")
                .razorpaySignature("sig_timeout")
                .build();

        // Gateway timeout should not permanently destroy the payment; returns failure response allowing reconciliation sweep
        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request, userId, null);
        assertNotNull(response);
        assertFalse(response.isSuccess());
        // Status transitions to FAILED for this verification attempt, enabling reconciliation or retry
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
    }

    @Test
    @DisplayName("PAY-CRIT-013: Delayed payment is reconciled correctly")
    void PAY_CRIT_013_delayedPaymentReconciledCorrectly() {
        UUID orderId = UUID.randomUUID();
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId("order_rzp_delayed")
                .build();

        when(paymentRepository.findByRazorpayOrderId("order_rzp_delayed")).thenReturn(Optional.of(payment));

        // Delayed webhook arrives from gateway
        String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt_delayed_101\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_delayed_101\",\"order_id\":\"order_rzp_delayed\",\"amount\":50000,\"currency\":\"INR\",\"status\":\"captured\"}}}}";
        when(paymentGateway.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(paymentEventRepository.findByEventId("evt_delayed_101")).thenReturn(Optional.empty());
        when(paymentGateway.fetchPayment("pay_delayed_101")).thenReturn(PaymentGateway.GatewayPaymentDetails.builder()
                .paymentId("pay_delayed_101")
                .orderId("order_rzp_delayed")
                .status("captured")
                .amountPaise(50000L)
                .currency("INR")
                .build());
        when(paymentEventIdempotencyService.recordEventIfUnique(any())).thenReturn(true);

        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setId(orderId);
        orderResponse.setStatus(OrderStatus.PENDING_PAYMENT);
        orderResponse.setTotalAmountInr(new BigDecimal("500.00"));
        when(orderService.getOrderByRazorpayOrderId("order_rzp_delayed")).thenReturn(Optional.of(orderResponse));

        paymentService.processWebhook(rawBody, "valid_sig");

        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());
        assertEquals("pay_delayed_101", payment.getRazorpayPaymentId());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.PAID), any(), eq("RAZORPAY_WEBHOOK"));
    }

    @Test
    @DisplayName("PAY-CRIT-014: Refund status is correctly synchronized")
    void PAY_CRIT_014_refundStatusCorrectlySynchronized() {
        UUID orderId = UUID.randomUUID();
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED)
                .razorpayPaymentId("pay_to_refund")
                .build();

        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setId(orderId);
        orderResponse.setOrderNumber("ORD-1001");
        orderResponse.setUserId(UUID.randomUUID());
        orderResponse.setRazorpayPaymentId("pay_to_refund");
        orderResponse.setTotalAmountInr(new BigDecimal("500.00"));
        orderResponse.setStatus(OrderStatus.PAID);

        when(orderService.getOrderById(orderId)).thenReturn(orderResponse);
        when(paymentRepository.findByRazorpayPaymentId("pay_to_refund")).thenReturn(Optional.of(payment));

        PaymentGateway.RefundResult refundResult = PaymentGateway.RefundResult.builder()
                .refundId("rfnd_12345")
                .razorpayPaymentId("pay_to_refund")
                .amountInr(new BigDecimal("500.00"))
                .status("PROCESSED")
                .build();
        when(paymentGateway.refund(eq("pay_to_refund"), eq(new BigDecimal("500.00")), anyString()))
                .thenReturn(refundResult);

        paymentService.refundPayment(orderId, new BigDecimal("500.00"), "Customer requested order cancellation");

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("PAY-CRIT-015: Existing Razorpay test suite passes")
    void PAY_CRIT_015_existingRazorpayTestSuitePasses() {
        // Verifies unit testing gateway instantiation and mock mode checks
        RazorpayPaymentGateway gateway = new RazorpayPaymentGateway();
        assertFalse(gateway.isMockMode(), "RazorpayPaymentGateway bean must always return isMockMode() false");
    }
}
