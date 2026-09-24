package com.sporekart.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final com.sporekart.training.application.TrainingService trainingService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
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

    @Transactional
    public PaymentDtos.VerifyPaymentResponse verifyPayment(PaymentDtos.VerifyPaymentRequest request) {
        boolean validSignature = paymentGateway.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

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
                    .eventDataJson("{\"reason\":\"Invalid signature\"}")
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

    @Transactional
    public String processWebhook(String rawBody, String signatureHeader) {
        if (!paymentGateway.verifyWebhookSignature(rawBody, signatureHeader)) {
            throw new IllegalArgumentException("Invalid Razorpay webhook signature");
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String eventType = root.path("event").asText();
            String eventId = root.path("event_id").asText();

            // Duplicate Webhook Protection
            if (eventId != null && !eventId.trim().isEmpty()) {
                Optional<PaymentEvent> existing = paymentEventRepository.findByEventId(eventId);
                if (existing.isPresent()) {
                    return "Webhook event already processed (idempotent ignore)";
                }
            }

            JsonNode payload = root.path("payload").path("payment").path("entity");
            String razorpayOrderId = payload.path("order_id").asText();
            String razorpayPaymentId = payload.path("id").asText();

            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseGet(() -> paymentRepository.findByRazorpayPaymentId(razorpayPaymentId).orElse(null));

            if ("payment.captured".equalsIgnoreCase(eventType) || "order.paid".equalsIgnoreCase(eventType)) {
                if (payment != null) {
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
                paymentEventRepository.save(event);
                if (payment != null) paymentRepository.save(payment);

                // Find associated Order
                Optional<OrderResponse> orderOpt = orderService.getOrderByRazorpayOrderId(razorpayOrderId);
                if (orderOpt.isPresent()) {
                    OrderResponse order = orderOpt.get();
                    orderService.setRazorpayPaymentId(order.getId(), razorpayPaymentId);
                    orderService.updateOrderStatus(order.getId(), OrderStatus.PAID, "Payment captured via webhook", "RAZORPAY_WEBHOOK");
                    orderService.confirmOrderInventory(order.getId());
                }
            } else if ("payment.failed".equalsIgnoreCase(eventType)) {
                if (payment != null) {
                    payment.setStatus(PaymentStatus.FAILED);
                    PaymentEvent event = PaymentEvent.builder()
                            .payment(payment)
                            .eventType(eventType)
                            .eventId(eventId)
                            .eventDataJson(rawBody)
                            .createdBy("RAZORPAY_WEBHOOK")
                            .build();
                    payment.addEvent(event);
                    paymentRepository.save(payment);
                }
            }

            return "Webhook processed successfully: " + eventType;
        } catch (Exception e) {
            throw new RuntimeException("Error processing Razorpay webhook: " + e.getMessage(), e);
        }
    }

    @Transactional
    public PaymentGateway.RefundResult refundPayment(UUID orderId, BigDecimal amountInr, String reason) {
        OrderResponse order = orderService.getOrderById(orderId);

        if (order.getRazorpayPaymentId() == null) {
            throw new IllegalStateException("Cannot refund order without payment ID");
        }

        PaymentGateway.RefundResult refundResult = paymentGateway.refund(order.getRazorpayPaymentId(), amountInr, reason);

        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayPaymentId(order.getRazorpayPaymentId());
        paymentOpt.ifPresent(payment -> {
            payment.setStatus(PaymentStatus.REFUNDED);
            PaymentEvent event = PaymentEvent.builder()
                    .payment(payment)
                    .eventType("REFUND_PROCESSED")
                    .eventDataJson("{\"refundId\":\"" + refundResult.getRefundId() + "\",\"amount\":\"" + amountInr + "\"}")
                    .createdBy("SYSTEM_REFUND")
                    .build();
            payment.addEvent(event);
            paymentRepository.save(payment);
        });

        orderService.updateOrderStatus(orderId, OrderStatus.REFUNDED, "Refund processed: " + refundResult.getRefundId(), "SYSTEM_REFUND");

        return refundResult;
    }

    @Transactional(readOnly = true)
    public PaymentDtos.PaymentSummaryResponse getPaymentSummary(String type, UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("Payment ID is required");
        }

        boolean isEnrollment = "ENROLLMENT".equalsIgnoreCase(type);

        if (!isEnrollment) {
            try {
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
            } catch (Exception e) {
                isEnrollment = true;
            }
        }

        if (isEnrollment) {
            com.sporekart.training.domain.Enrollment enrollment = trainingService.getEnrollmentById(id);
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

        throw new IllegalArgumentException("Payment session not found for ID: " + id);
    }

    @Transactional
    public PaymentDtos.VerifyEnrollmentPaymentResponse verifyEnrollmentPayment(PaymentDtos.VerifyEnrollmentPaymentRequest request) {
        String txRef = request.getTransactionReference();
        if (txRef == null || txRef.trim().isEmpty()) {
            txRef = "PAY-MOCK-" + request.getPaymentMethod() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        com.sporekart.training.domain.Enrollment enrollment = trainingService.confirmEnrollmentPayment(request.getEnrollmentId(), txRef);

        return PaymentDtos.VerifyEnrollmentPaymentResponse.builder()
                .isSuccess(true)
                .message("Training enrollment payment successful")
                .enrollmentId(enrollment.getId())
                .paymentReference(txRef)
                .build();
    }
}
