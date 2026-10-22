package com.sporekart.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.order.domain.Order;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventRepository paymentEventRepository;
    private final PaymentGateway paymentGateway;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final com.sporekart.training.application.TrainingService trainingService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final com.sporekart.wallet.application.WalletService walletService;
    private final PaymentEventIdempotencyService paymentEventIdempotencyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PaymentDtos.InitiatePaymentResponse initiatePayment(UUID orderId) {
        OrderResponse order = orderService.getOrderById(orderId);

        PaymentGateway.InitiatePaymentResult result = paymentGateway.createPaymentOrder(
                orderId, order.getOrderNumber(), order.getTotalAmountInr()
        );

        Payment payment = Payment.builder()
                .orderId(orderId)
                .razorpayOrderId(result.getRazorpayOrderId())
                .amountInr(order.getTotalAmountInr())
                .currency(result.getCurrency())
                .status(PaymentStatus.INITIATED)
                .build();

        PaymentEvent event = PaymentEvent.builder()
                .payment(payment)
                .eventType("PAYMENT_INITIATED")
                .eventDataJson("{\"amount\":\"" + order.getTotalAmountInr() + "\"}")
                .createdBy("SYSTEM")
                .build();
        payment.addEvent(event);

        paymentRepository.save(payment);

        orderService.setRazorpayOrderId(orderId, result.getRazorpayOrderId());

        return PaymentDtos.InitiatePaymentResponse.builder()
                .razorpayOrderId(result.getRazorpayOrderId())
                .amountInr(order.getTotalAmountInr())
                .currency(result.getCurrency())
                .razorpayKeyId(result.getRazorpayKeyId())
                .orderId(orderId)
                .build();
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PaymentDtos.VerifyPaymentResponse verifyPayment(PaymentDtos.VerifyPaymentRequest request) {
        return verifyPayment(request, null, null);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PaymentDtos.VerifyPaymentResponse verifyPayment(
            PaymentDtos.VerifyPaymentRequest request,
            UUID callerUserId,
            String callerSessionId) {

        // Source of truth for order association is DB Payment entity linked to razorpayOrderId
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException("No existing payment record found for Razorpay order ID: " + request.getRazorpayOrderId()));

        UUID targetOrderId = payment.getOrderId();
        if (targetOrderId == null) {
            throw new IllegalArgumentException("Payment record is missing associated order ID");
        }

        if (request.getOrderId() != null && !request.getOrderId().equals(targetOrderId)) {
            log.error("POTENTIAL FRAUD / MISMATCH ATTEMPT: Client provided orderId={} does not match payment record orderId={} for razorpayOrderId={}",
                    request.getOrderId(), targetOrderId, request.getRazorpayOrderId());
            throw new IllegalArgumentException("Payment verification failed: Mismatched order reference");
        }

        // Caller ownership verification (if caller context provided)
        if (callerUserId != null || callerSessionId != null) {
            OrderResponse order = orderService.getOrderById(targetOrderId);
            if (order.getUserId() != null) {
                if (callerUserId == null || !callerUserId.equals(order.getUserId())) {
                    log.warn("Payment verification denied: Authenticated user {} is not owner of order {}", callerUserId, targetOrderId);
                    throw new com.sporekart.shared.application.ForbiddenOperationException("You are not authorized to verify payment for this order");
                }
            } else if (order.getSessionId() != null) {
                if (callerSessionId != null && !callerSessionId.equals(order.getSessionId())) {
                    log.warn("Payment verification denied: Guest session {} does not match order session {}", callerSessionId, order.getSessionId());
                    throw new com.sporekart.shared.application.ForbiddenOperationException("You are not authorized to verify payment for this order");
                }
            }
        }

        // Idempotency check: if already captured, return success immediately without duplicate inventory processing
        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            log.info("Payment {} for order {} already CAPTURED. Returning idempotent success.", payment.getId(), targetOrderId);
            return PaymentDtos.VerifyPaymentResponse.builder()
                    .isSuccess(true)
                    .message("Payment already verified")
                    .orderId(targetOrderId)
                    .build();
        }

        boolean validSignature = paymentGateway.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        // Authoritative server-to-server gateway check
        PaymentGateway.GatewayPaymentDetails gatewayDetails = paymentGateway.fetchPayment(request.getRazorpayPaymentId());
        if (gatewayDetails != null) {
            if (!paymentGateway.isMockMode()) {
                if (!"captured".equalsIgnoreCase(gatewayDetails.getStatus()) && !"authorized".equalsIgnoreCase(gatewayDetails.getStatus())) {
                    log.error("Gateway status verification failed: status is {} for paymentId={}", gatewayDetails.getStatus(), request.getRazorpayPaymentId());
                    validSignature = false;
                }
                if (gatewayDetails.getAmountPaise() != null && payment.getAmountInr() != null) {
                    long expectedPaise = payment.getAmountInr().multiply(new BigDecimal("100")).longValue();
                    if (gatewayDetails.getAmountPaise() != expectedPaise) {
                        log.error("Gateway amount mismatch: received {} paise, expected {} paise", gatewayDetails.getAmountPaise(), expectedPaise);
                        validSignature = false;
                    }
                }
                if (gatewayDetails.getCurrency() != null && !"INR".equalsIgnoreCase(gatewayDetails.getCurrency())) {
                    log.error("Gateway currency mismatch: received {}, expected INR", gatewayDetails.getCurrency());
                    validSignature = false;
                }
                if (gatewayDetails.getOrderId() != null && !gatewayDetails.getOrderId().equals(request.getRazorpayOrderId())) {
                    log.error("Gateway order ID mismatch: gateway order {} != expected order {}", gatewayDetails.getOrderId(), request.getRazorpayOrderId());
                    validSignature = false;
                }
            } else {
                // In mock mode: respect test status/amount flags if simulated
                if ("failed".equalsIgnoreCase(gatewayDetails.getStatus())) {
                    validSignature = false;
                }
                if (gatewayDetails.getAmountPaise() != null && payment.getAmountInr() != null) {
                    long expectedPaise = payment.getAmountInr().multiply(new BigDecimal("100")).longValue();
                    if (gatewayDetails.getAmountPaise() != expectedPaise) {
                        validSignature = false;
                    }
                }
            }
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());

        if (validSignature) {
            payment.setStatus(PaymentStatus.CAPTURED);
            PaymentEvent event = PaymentEvent.builder()
                    .payment(payment)
                    .eventType("PAYMENT_CAPTURED_SIGNATURE")
                    .eventDataJson("{\"paymentId\":\"" + request.getRazorpayPaymentId() + "\"}")
                    .createdBy("FRONTEND_VERIFY")
                    .build();
            payment.addEvent(event);
            paymentRepository.save(payment);

            orderService.setRazorpayPaymentId(targetOrderId, request.getRazorpayPaymentId());
            orderService.updateOrderStatus(targetOrderId, OrderStatus.PAID, "Payment verified successfully", "PAYMENT_SERVICE");

            // Confirm inventory purchase
            orderService.confirmOrderInventory(targetOrderId);

            // Publish PaymentCapturedEvent
            eventPublisher.publishEvent(com.sporekart.analytics.domain.events.PaymentCapturedEvent.builder()
                    .paymentId(payment.getId())
                    .orderId(targetOrderId)
                    .amountInr(payment.getAmountInr())
                    .razorpayPaymentId(request.getRazorpayPaymentId())
                    .build());

            return PaymentDtos.VerifyPaymentResponse.builder()
                    .isSuccess(true)
                    .message("Payment verified successfully")
                    .orderId(targetOrderId)
                    .build();
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            PaymentEvent event = PaymentEvent.builder()
                    .payment(payment)
                    .eventType("PAYMENT_FAILED_INVALID_SIGNATURE")
                    .eventDataJson("{\"reason\":\"Invalid signature or gateway verification failure\"}")
                    .createdBy("FRONTEND_VERIFY")
                    .build();
            payment.addEvent(event);
            paymentRepository.save(payment);

            return PaymentDtos.VerifyPaymentResponse.builder()
                    .isSuccess(false)
                    .message("Payment signature verification failed")
                    .orderId(targetOrderId)
                    .build();
        }
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public String processWebhook(String rawBody, String signatureHeader) {
        if (!paymentGateway.verifyWebhookSignature(rawBody, signatureHeader)) {
            throw new IllegalArgumentException("Invalid Razorpay webhook signature");
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String eventType = root.path("event").asText();
            String eventId = root.path("event_id").asText();

            // Duplicate Webhook Protection (Fast Read Check)
            if (eventId != null && !eventId.trim().isEmpty()) {
                Optional<PaymentEvent> existing = paymentEventRepository.findByEventId(eventId);
                if (existing.isPresent()) {
                    log.info("Webhook event ID {} already processed. Idempotent ignore.", eventId);
                    return "Webhook event already processed (idempotent ignore)";
                }
            }

            JsonNode payload = root.path("payload").path("payment").path("entity");
            String razorpayOrderId = payload.path("order_id").asText("");
            String razorpayPaymentId = payload.path("id").asText("");

            Payment payment = null;
            if (!razorpayOrderId.trim().isEmpty()) {
                payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            }
            if (payment == null && !razorpayPaymentId.trim().isEmpty()) {
                payment = paymentRepository.findByRazorpayPaymentId(razorpayPaymentId).orElse(null);
            }

            if ("payment.captured".equalsIgnoreCase(eventType) || "order.paid".equalsIgnoreCase(eventType)) {
                if (payment != null) {
                    if (payment.getStatus() == PaymentStatus.CAPTURED) {
                        log.info("Payment for Razorpay order {} is already CAPTURED. Idempotent ignore.", razorpayOrderId);
                        return "Webhook event already processed (payment already captured)";
                    }
                    payment.setRazorpayPaymentId(razorpayPaymentId);
                    payment.setStatus(PaymentStatus.CAPTURED);
                }

                PaymentEvent event = PaymentEvent.builder()
                        .payment(payment)
                        .eventType(eventType)
                        .eventId(eventId)
                        .eventDataJson(rawBody)
                        .createdBy("RAZORPAY_WEBHOOK")
                        .build();
                boolean recorded = paymentEventIdempotencyService.recordEventIfUnique(event);
                if (!recorded) {
                    log.warn("Concurrent duplicate webhook event ID caught by idempotency service: {}", eventId);
                    return "Webhook event already processed (idempotent ignore)";
                }

                if (payment != null) paymentRepository.save(payment);

                // Find associated Order
                Optional<OrderResponse> orderOpt = orderService.getOrderByRazorpayOrderId(razorpayOrderId);
                if (orderOpt.isPresent()) {
                    OrderResponse order = orderOpt.get();
                    if (order.getStatus() != OrderStatus.PAID) {
                        orderService.setRazorpayPaymentId(order.getId(), razorpayPaymentId);
                        orderService.updateOrderStatus(order.getId(), OrderStatus.PAID, "Payment captured via webhook", "RAZORPAY_WEBHOOK");
                        orderService.confirmOrderInventory(order.getId());
                    }
                }

                // Handle training enrollment if associated with this payment
                if (payment != null && payment.getOrderId() == null && payment.getEvents() != null) {
                    UUID enrollmentId = payment.getEvents().stream()
                            .filter(e -> "ENROLLMENT_PAYMENT_INITIATED".equals(e.getEventType()))
                            .findFirst()
                            .map(e -> {
                                try {
                                    return UUID.fromString(objectMapper.readTree(e.getEventDataJson()).path("enrollmentId").asText());
                                } catch (Exception ex) {
                                    return null;
                                }
                            })
                            .orElse(null);

                    if (enrollmentId != null) {
                        try {
                            trainingService.confirmEnrollmentPayment(enrollmentId, razorpayPaymentId);
                            log.info("Confirmed training enrollment {} via webhook", enrollmentId);
                        } catch (Exception ex) {
                            log.error("Failed to confirm training enrollment {} from webhook: {}", enrollmentId, ex.getMessage());
                        }
                    }
                }
            } else if ("payment.failed".equalsIgnoreCase(eventType)) {
                if (payment != null && payment.getStatus() != PaymentStatus.FAILED) {
                    payment.setStatus(PaymentStatus.FAILED);
                    PaymentEvent event = PaymentEvent.builder()
                            .payment(payment)
                            .eventType(eventType)
                            .eventId(eventId)
                            .eventDataJson(rawBody)
                            .createdBy("RAZORPAY_WEBHOOK")
                            .build();
                    boolean recorded = paymentEventIdempotencyService.recordEventIfUnique(event);
                    if (!recorded) {
                        log.warn("Concurrent duplicate failed webhook event ID caught by idempotency service: {}", eventId);
                        return "Webhook event already processed (idempotent ignore)";
                    }
                    paymentRepository.save(payment);
                }
            } else if ("refund.processed".equalsIgnoreCase(eventType) || "refund.failed".equalsIgnoreCase(eventType)) {
                JsonNode refundNode = root.path("payload").path("refund").path("entity");
                String refundId = refundNode.path("id").asText();
                String refPaymentId = refundNode.path("payment_id").asText(razorpayPaymentId);

                Payment refPayment = payment;
                if (refPayment == null && refPaymentId != null && !refPaymentId.isBlank()) {
                    refPayment = paymentRepository.findByRazorpayPaymentId(refPaymentId).orElse(null);
                }

                if (refPayment != null && "refund.processed".equalsIgnoreCase(eventType)) {
                    refPayment.setStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(refPayment);
                }

                PaymentEvent event = PaymentEvent.builder()
                        .payment(refPayment)
                        .eventType(eventType)
                        .eventId(eventId)
                        .eventDataJson(rawBody)
                        .createdBy("RAZORPAY_WEBHOOK")
                        .build();
                boolean recorded = paymentEventIdempotencyService.recordEventIfUnique(event);
                if (!recorded) {
                    log.warn("Concurrent duplicate refund webhook event ID caught by idempotency service: {}", eventId);
                    return "Webhook event already processed (idempotent ignore)";
                }

                log.info("Processed webhook {} for refund ID {} on payment {}", eventType, refundId, refPaymentId);
            }

            return "Webhook processed successfully: " + eventType;
        } catch (Exception e) {
            log.error("Error processing Razorpay webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Error processing Razorpay webhook: " + e.getMessage(), e);
        }
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PaymentGateway.RefundResult refundPayment(UUID orderId, BigDecimal amountInr, String reason) {
        OrderResponse order = orderService.getOrderById(orderId);

        if (order.getRazorpayPaymentId() == null || order.getRazorpayPaymentId().isBlank()) {
            throw new IllegalStateException("Cannot refund order without payment ID: " + orderId);
        }

        if (amountInr != null && order.getTotalAmountInr() != null && amountInr.compareTo(order.getTotalAmountInr()) > 0) {
            throw new IllegalArgumentException("Refund amount (" + amountInr + ") cannot exceed total order amount (" + order.getTotalAmountInr() + ")");
        }

        BigDecimal refundAmt = (amountInr != null) ? amountInr : order.getTotalAmountInr();

        PaymentGateway.RefundResult refundResult = paymentGateway.refund(order.getRazorpayPaymentId(), refundAmt, reason);

        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayPaymentId(order.getRazorpayPaymentId());
        paymentOpt.ifPresent(payment -> {
            payment.setStatus(PaymentStatus.REFUNDED);
            PaymentEvent event = PaymentEvent.builder()
                    .payment(payment)
                    .eventType("REFUND_PROCESSED")
                    .eventDataJson("{\"refundId\":\"" + refundResult.getRefundId() + "\",\"amount\":\"" + refundAmt + "\"}")
                    .createdBy("SYSTEM_REFUND")
                    .build();
            payment.addEvent(event);
            paymentRepository.save(payment);
        });

        if (order.getUserId() != null && refundAmt != null && refundAmt.compareTo(BigDecimal.ZERO) > 0) {
            try {
                walletService.processRefundToWallet(
                        order.getUserId(),
                        refundAmt,
                        orderId,
                        null,
                        refundResult.getRefundId(),
                        reason != null ? reason : "Order cancellation refund credited to Sporekart Wallet",
                        "SYSTEM_REFUND"
                );
            } catch (Exception e) {
                log.warn("Could not credit refund to wallet for user {}: {}", order.getUserId(), e.getMessage());
            }
        }

        orderService.updateOrderStatus(orderId, OrderStatus.REFUNDED, "Refund processed (Ref: " + refundResult.getRefundId() + ")", "SYSTEM_REFUND");

        return refundResult;
    }

    @Transactional(readOnly = true)
    public PaymentDtos.PaymentSummaryResponse getPaymentSummary(String type, UUID id) {
        return getPaymentSummary(type, id, null, null);
    }

    @Transactional(readOnly = true)
    public PaymentDtos.PaymentSummaryResponse getPaymentSummary(String type, UUID id, UUID userId, String sessionId) {
        if (id == null) {
            throw new IllegalArgumentException("Payment ID is required");
        }

        boolean isEnrollment = "ENROLLMENT".equalsIgnoreCase(type);

        if (!isEnrollment) {
            Optional<Order> orderOpt = orderRepository.findById(id);
            if (orderOpt.isPresent()) {
                Order orderEntity = orderOpt.get();
                validateOrderAccess(orderEntity, userId, sessionId);

                OrderResponse order = orderService.getOrderById(id);
                String city = (order.getShippingAddress() != null && order.getShippingAddress().getCity() != null)
                        ? order.getShippingAddress().getCity() : "";
                String state = (order.getShippingAddress() != null && order.getShippingAddress().getState() != null)
                        ? order.getShippingAddress().getState() : "";
                String subtitle = (!city.isEmpty() || !state.isEmpty())
                        ? (city + (city.isEmpty() || state.isEmpty() ? "" : ", ") + state) : "Delivery Order";
                String statusStr = order.getStatus() != null ? order.getStatus().name() : "PENDING_PAYMENT";
                String orderNo = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().toString().substring(0, 8);

                return PaymentDtos.PaymentSummaryResponse.builder()
                        .type("ORDER")
                        .id(order.getId())
                        .title("Order #" + orderNo)
                        .subtitle(subtitle)
                        .amountInr(order.getTotalAmountInr() != null ? order.getTotalAmountInr() : BigDecimal.ZERO)
                        .status(statusStr)
                        .customerName(order.getShippingAddress() != null ? order.getShippingAddress().getRecipientName() : null)
                        .customerPhone(order.getShippingAddress() != null ? order.getShippingAddress().getPhone() : null)
                        .build();
            } else {
                isEnrollment = true;
            }
        }

        if (isEnrollment) {
            com.sporekart.training.domain.Enrollment enrollment = trainingService.getEnrollmentById(id);
            if (enrollment != null) {
                if (enrollment.getUserId() != null) {
                    if (userId == null || !userId.equals(enrollment.getUserId())) {
                        throw new ForbiddenOperationException("Access denied: You are not authorized to access this training payment summary");
                    }
                }
                String title = enrollment.getCourse() != null && enrollment.getCourse().getTitle() != null
                        ? enrollment.getCourse().getTitle() : "Training Course";
                String batchCode = enrollment.getBatch() != null && enrollment.getBatch().getBatchCode() != null
                        ? enrollment.getBatch().getBatchCode() : "UPCOMING";
                String statusStr = enrollment.getStatus() != null ? enrollment.getStatus().name() : "PENDING_PAYMENT";

                return PaymentDtos.PaymentSummaryResponse.builder()
                        .type("ENROLLMENT")
                        .id(enrollment.getId())
                        .title(title)
                        .subtitle("Batch: " + batchCode)
                        .amountInr(enrollment.getFeePaidInr() != null ? enrollment.getFeePaidInr() : BigDecimal.ZERO)
                        .status(statusStr)
                        .build();
            }
        }

        throw new IllegalArgumentException("Payment session not found for ID: " + id);
    }

    private void validateOrderAccess(Order order, UUID userId, String sessionId) {
        if (order.getUserId() != null) {
            if (userId == null || !userId.equals(order.getUserId())) {
                throw new ForbiddenOperationException("Access denied: You are not authorized to access this payment summary");
            }
        } else {
            if (sessionId == null || sessionId.trim().isEmpty() || !sessionId.equals(order.getSessionId())) {
                throw new ForbiddenOperationException("Access denied: You are not authorized to access this guest payment summary");
            }
        }
    }

    @Transactional
    public PaymentDtos.InitiatePaymentResponse initiateEnrollmentPayment(UUID enrollmentId, UUID userId) {
        if (enrollmentId == null) {
            throw new IllegalArgumentException("Enrollment ID is required");
        }
        com.sporekart.training.domain.Enrollment enrollment = trainingService.getEnrollmentById(enrollmentId);
        if (userId == null || !userId.equals(enrollment.getUserId())) {
            throw new ForbiddenOperationException("Access denied: You are not authorized to initiate payment for this enrollment");
        }

        BigDecimal feeInr = enrollment.getFeePaidInr() != null ? enrollment.getFeePaidInr() : BigDecimal.ZERO;
        if (feeInr.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentDtos.InitiatePaymentResponse.builder()
                    .razorpayOrderId("FREE-ENROLL-" + enrollment.getId())
                    .amountInr(BigDecimal.ZERO)
                    .currency("INR")
                    .razorpayKeyId(null)
                    .orderId(null)
                    .build();
        }

        String receipt = "ENROLL-" + enrollment.getId();
        PaymentGateway.InitiatePaymentResult result = paymentGateway.createPaymentOrder(null, receipt, feeInr);

        Payment payment = Payment.builder()
                .orderId(null)
                .razorpayOrderId(result.getRazorpayOrderId())
                .amountInr(feeInr)
                .currency(result.getCurrency())
                .status(PaymentStatus.INITIATED)
                .build();

        PaymentEvent event = PaymentEvent.builder()
                .payment(payment)
                .eventType("ENROLLMENT_PAYMENT_INITIATED")
                .eventDataJson("{\"enrollmentId\":\"" + enrollment.getId() + "\",\"amount\":\"" + feeInr + "\"}")
                .createdBy("CUSTOMER")
                .build();
        payment.addEvent(event);
        paymentRepository.save(payment);

        return PaymentDtos.InitiatePaymentResponse.builder()
                .razorpayOrderId(result.getRazorpayOrderId())
                .amountInr(feeInr)
                .currency(result.getCurrency())
                .razorpayKeyId(result.getRazorpayKeyId())
                .orderId(null)
                .build();
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PaymentDtos.VerifyEnrollmentPaymentResponse verifyEnrollmentPayment(PaymentDtos.VerifyEnrollmentPaymentRequest request) {
        return verifyEnrollmentPayment(request, null);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PaymentDtos.VerifyEnrollmentPaymentResponse verifyEnrollmentPayment(PaymentDtos.VerifyEnrollmentPaymentRequest request, UUID callingUserId) {
        if (request.getEnrollmentId() == null) {
            throw new IllegalArgumentException("Enrollment ID is required");
        }

        com.sporekart.training.domain.Enrollment enrollment = trainingService.getEnrollmentById(request.getEnrollmentId());

        if (callingUserId == null || !callingUserId.equals(enrollment.getUserId())) {
            log.error("ENROLLMENT PAYMENT FORGERY ATTEMPT: User {} attempted to verify payment for enrollment {} owned by user {}",
                    callingUserId, enrollment.getId(), enrollment.getUserId());
            throw new ForbiddenOperationException("Access denied: You are not authorized to process payment for this training enrollment");
        }

        // Idempotency: if already confirmed, return success
        if (enrollment.getStatus() == com.sporekart.training.domain.EnrollmentStatus.CONFIRMED) {
            return PaymentDtos.VerifyEnrollmentPaymentResponse.builder()
                    .isSuccess(true)
                    .message("Training enrollment already confirmed")
                    .enrollmentId(enrollment.getId())
                    .paymentReference(enrollment.getPaymentReference())
                    .build();
        }

        if (enrollment.getStatus() == com.sporekart.training.domain.EnrollmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot verify payment for a cancelled enrollment");
        }

        BigDecimal feeInr = enrollment.getFeePaidInr() != null ? enrollment.getFeePaidInr() : BigDecimal.ZERO;
        String rzpOrderId = request.getRazorpayOrderId();
        String rzpPaymentId = request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : request.getTransactionReference();
        String signature = request.getRazorpaySignature();

        if (feeInr.compareTo(BigDecimal.ZERO) <= 0) {
            // Free enrollment bypass/confirmation
            String ref = (rzpPaymentId != null && !rzpPaymentId.trim().isEmpty()) ? rzpPaymentId : "FREE_ENROLLMENT";
            com.sporekart.training.domain.Enrollment confirmedEnrollment = trainingService.confirmEnrollmentPayment(enrollment.getId(), ref);
            return PaymentDtos.VerifyEnrollmentPaymentResponse.builder()
                    .isSuccess(true)
                    .message("Free training enrollment confirmed")
                    .enrollmentId(confirmedEnrollment.getId())
                    .paymentReference(ref)
                    .build();
        }

        // Paid course enrollment:
        if (paymentGateway.isMockMode()) {
            if (rzpPaymentId == null || rzpPaymentId.trim().isEmpty()) {
                throw new IllegalArgumentException("Transaction reference is required for payment verification");
            }
            if (rzpOrderId == null || rzpOrderId.trim().isEmpty()) {
                rzpOrderId = "ENROLLMENT-" + enrollment.getId();
            }
            if (signature == null || signature.trim().isEmpty()) {
                signature = "mock_signature";
            }
        } else {
            // Production / non-mock mode: strictly require all Razorpay parameters
            if (rzpOrderId == null || rzpOrderId.trim().isEmpty()) {
                throw new IllegalArgumentException("Razorpay Order ID is required for paid enrollment verification");
            }
            if (rzpPaymentId == null || rzpPaymentId.trim().isEmpty()) {
                throw new IllegalArgumentException("Razorpay Payment ID is required for paid enrollment verification");
            }
            if (signature == null || signature.trim().isEmpty()) {
                throw new IllegalArgumentException("Razorpay Signature is required for paid enrollment verification");
            }
            boolean validSig = paymentGateway.verifySignature(rzpOrderId, rzpPaymentId, signature);
            if (!validSig) {
                log.error("Invalid signature on enrollment payment. Order: {}, Payment: {}", rzpOrderId, rzpPaymentId);
                throw new IllegalArgumentException("Invalid Razorpay payment signature for training enrollment");
            }
        }

        // Look up or link the Payment entity
        Optional<Payment> existingPaymentOpt = paymentRepository.findByRazorpayOrderId(rzpOrderId);
        Payment payment;
        if (existingPaymentOpt.isPresent()) {
            payment = existingPaymentOpt.get();
            if (payment.getAmountInr().compareTo(feeInr) < 0) {
                throw new IllegalArgumentException("Payment amount is less than required training course fee");
            }
            payment.setRazorpayPaymentId(rzpPaymentId);
            payment.setRazorpaySignature(signature);
            payment.setStatus(PaymentStatus.CAPTURED);
        } else {
            payment = Payment.builder()
                    .orderId(null)
                    .razorpayOrderId(rzpOrderId)
                    .razorpayPaymentId(rzpPaymentId)
                    .razorpaySignature(signature)
                    .amountInr(feeInr)
                    .currency("INR")
                    .status(PaymentStatus.CAPTURED)
                    .build();
        }

        PaymentEvent event = PaymentEvent.builder()
                .payment(payment)
                .eventType("ENROLLMENT_PAYMENT_CAPTURED")
                .eventDataJson("{\"enrollmentId\":\"" + enrollment.getId() + "\",\"paymentReference\":\"" + rzpPaymentId + "\"}")
                .createdBy("FRONTEND_ENROLLMENT_VERIFY")
                .build();
        payment.addEvent(event);
        paymentRepository.save(payment);

        com.sporekart.training.domain.Enrollment confirmedEnrollment = trainingService.confirmEnrollmentPayment(request.getEnrollmentId(), rzpPaymentId);

        return PaymentDtos.VerifyEnrollmentPaymentResponse.builder()
                .isSuccess(true)
                .message("Training enrollment payment successful")
                .enrollmentId(confirmedEnrollment.getId())
                .paymentReference(rzpPaymentId)
                .build();
    }
}
