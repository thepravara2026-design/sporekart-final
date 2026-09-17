package com.sporekart.payment.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentGateway {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class InitiatePaymentResult {
        private String razorpayOrderId;
        private BigDecimal amountInr;
        private String currency;
        private String razorpayKeyId;
        private UUID orderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class RefundResult {
        private String refundId;
        private String razorpayPaymentId;
        private BigDecimal amountInr;
        private String status; // PROCESSED, PENDING
    }

    InitiatePaymentResult createPaymentOrder(UUID orderId, String orderNumber, BigDecimal amountInr);

    boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature);

    boolean verifyWebhookSignature(String rawBody, String signatureHeader);

    RefundResult refund(String razorpayPaymentId, BigDecimal amountInr, String reason);
}
