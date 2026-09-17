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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventRepository paymentEventRepository;
    private final PaymentGateway paymentGateway;
    private final OrderService orderService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PaymentDtos.InitiatePaymentResponse initiatePayment(UUID orderId) {
        OrderResponse order = orderService.getOrderDetails(orderId, null);

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

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseGet(() -> Payment.builder()
                        .orderId(request.getOrderId())
                        .razorpayOrderId(request.getRazorpayOrderId())
                        .amountInr(BigDecimal.ZERO)
                        .build());

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

            orderService.setRazorpayPaymentId(request.getOrderId(), request.getRazorpayPaymentId());
            orderService.updateOrderStatus(request.getOrderId(), OrderStatus.PAID, "Payment verified successfully", "PAYMENT_SERVICE");

            // Confirm inventory purchase
            orderService.confirmOrderInventory(request.getOrderId());

            return PaymentDtos.VerifyPaymentResponse.builder()
                    .isSuccess(true)
                    .message("Payment verified successfully")
                    .orderId(request.getOrderId())
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
                    .orderId(request.getOrderId())
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
        OrderResponse order = orderService.getOrderDetails(orderId, null);

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
}
