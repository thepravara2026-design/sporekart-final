package com.sporekart.payment.api;

import com.razorpay.RazorpayException;
import com.sporekart.analytics.domain.events.PaymentCapturedEvent;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.application.RazorpayPaymentGateway;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class RazorpayCheckoutController {

    private final RazorpayPaymentGateway razorpayPaymentGateway;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Standard Razorpay Order Creation Endpoint
     * POST /api/create-order (or /create-order)
     * Request: { amount (paise), currency, receipt }
     * Return: { order_id, amount, currency, key_id }
     * Minimum amount: 100 paise
     */
    @PostMapping({"/create-order", "/api/create-order", "/payment/create-order"})
    public ResponseEntity<?> createOrder(@RequestBody(required = false) RazorpayOrderDtos.CreateOrderRequest request) {
        if (request == null || request.getAmount() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "failure",
                    "error", "Amount is required and must be at least 100 paise",
                    "message", "Amount is required and must be at least 100 paise"
            ));
        }

        if (request.getAmount() < 100) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "failure",
                    "error", "Amount must be at least 100 paise",
                    "message", "Amount must be at least 100 paise"
            ));
        }

        try {
            RazorpayPaymentGateway.RazorpayOrderResult result = razorpayPaymentGateway.createRawOrder(
                    request.getAmount(),
                    request.getCurrency(),
                    request.getReceipt()
            );

            // If an internal Sporekart orderId was provided, link initiated payment entity
            if (request.getOrderId() != null) {
                try {
                    recordInitiatedPayment(request.getOrderId(), result.getOrderId(), BigDecimal.valueOf(result.getAmount()).divide(BigDecimal.valueOf(100)));
                } catch (Exception ex) {
                    log.warn("Could not record initiated payment link to order {}: {}", request.getOrderId(), ex.getMessage());
                }
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("order_id", result.getOrderId());
            response.put("amount", result.getAmount());
            response.put("currency", result.getCurrency());
            response.put("key_id", result.getKeyId());
            response.put("receipt", result.getReceipt());
            response.put("status", "created");
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            log.error("Razorpay gateway credentials error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "failure",
                    "error", "Razorpay authentication failed or credentials missing: " + e.getMessage(),
                    "message", "Unauthorized"
            ));
        } catch (RazorpayException e) {
            log.error("Razorpay API Exception during create-order: {}", e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("401") || msg.toLowerCase().contains("unauthorized") || msg.toLowerCase().contains("authentication failed")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "status", "failure",
                        "error", "Razorpay authentication failed: " + msg,
                        "message", "Unauthorized"
                ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "failure",
                    "error", "Razorpay order creation failed: " + msg,
                    "message", "Internal server error"
            ));
        } catch (Exception e) {
            log.error("Unexpected error in create-order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "failure",
                    "error", "Internal error: " + e.getMessage(),
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Standard Razorpay Signature Verification Endpoint
     * POST /api/verify-payment (or /verify-payment)
     * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
     * Compare generated signature with razorpay_signature
     * Return success only if signatures match
     * Signature mismatch: return 400, do NOT mark as paid
     * Missing fields: return 400
     */
    @PostMapping({"/verify-payment", "/api/verify-payment", "/payment/verify-payment"})
    public ResponseEntity<?> verifyPayment(@RequestBody(required = false) RazorpayOrderDtos.StandardVerifyPaymentRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "failure",
                    "error", "Missing request body",
                    "message", "order_id, payment_id, and signature are required",
                    "verified", false
            ));
        }

        String orderId = request.getOrderId();
        String paymentId = request.getPaymentId();
        String signature = request.getSignature();

        if (orderId == null || orderId.trim().isEmpty() ||
            paymentId == null || paymentId.trim().isEmpty() ||
            signature == null || signature.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "failure",
                    "error", "Missing required fields: order_id, payment_id, and signature are required",
                    "message", "Missing required fields",
                    "verified", false
            ));
        }

        orderId = orderId.trim();
        paymentId = paymentId.trim();
        signature = signature.trim();

        boolean isValid = razorpayPaymentGateway.verifySignature(orderId, paymentId, signature);

        if (!isValid) {
            log.warn("Razorpay payment signature verification failed for order_id={}, payment_id={}", orderId, paymentId);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "failure",
                    "error", "Signature mismatch",
                    "message", "Payment signature verification failed",
                    "verified", false
            ));
        }

        // Signature is valid! Update associated payment and order in Sporekart if linked
        try {
            updatePaymentAndOrderSuccess(orderId, paymentId, signature, request.getSporekartOrderId());
        } catch (Exception ex) {
            log.warn("Error updating internal order status after verified payment: {}", ex.getMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "success");
        response.put("message", "Payment verified successfully");
        response.put("verified", true);
        response.put("order_id", orderId);
        response.put("payment_id", paymentId);
        return ResponseEntity.ok(response);
    }

    private void recordInitiatedPayment(UUID orderId, String razorpayOrderId, BigDecimal amountInr) {
        Optional<Payment> existing = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (existing.isEmpty()) {
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .razorpayOrderId(razorpayOrderId)
                    .amountInr(amountInr)
                    .currency("INR")
                    .status(PaymentStatus.INITIATED)
                    .build();
            paymentRepository.save(payment);
            orderService.setRazorpayOrderId(orderId, razorpayOrderId);
        }
    }

    private void updatePaymentAndOrderSuccess(String razorpayOrderId, String razorpayPaymentId, String signature, UUID providedOrderId) {
        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        UUID targetOrderId = providedOrderId;
        Payment payment = null;

        if (paymentOpt.isPresent()) {
            payment = paymentOpt.get();
            if (targetOrderId == null) {
                targetOrderId = payment.getOrderId();
            }
        }

        if (payment != null) {
            if (payment.getStatus() == PaymentStatus.CAPTURED) {
                return; // Idempotent check
            }
            payment.setStatus(PaymentStatus.CAPTURED);
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setRazorpaySignature(signature);
            PaymentEvent event = PaymentEvent.builder()
                    .payment(payment)
                    .eventType("PAYMENT_CAPTURED_STANDARD_VERIFY")
                    .eventDataJson("{\"paymentId\":\"" + razorpayPaymentId + "\"}")
                    .createdBy("RAZORPAY_CHECKOUT")
                    .build();
            payment.addEvent(event);
            paymentRepository.save(payment);
        }

        if (targetOrderId != null) {
            try {
                orderService.setRazorpayPaymentId(targetOrderId, razorpayPaymentId);
                orderService.updateOrderStatus(targetOrderId, OrderStatus.PAID, "Payment verified successfully via Razorpay Standard Checkout", "RAZORPAY_CHECKOUT");
                orderService.confirmOrderInventory(targetOrderId);
                if (payment != null) {
                    eventPublisher.publishEvent(PaymentCapturedEvent.builder()
                            .paymentId(payment.getId())
                            .orderId(targetOrderId)
                            .amountInr(payment.getAmountInr())
                            .razorpayPaymentId(razorpayPaymentId)
                            .build());
                }
            } catch (Exception ex) {
                log.warn("Failed updating order {} status: {}", targetOrderId, ex.getMessage());
            }
        }
    }
}
