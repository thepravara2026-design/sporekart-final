package com.sporekart.payment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

public class PaymentDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitiatePaymentRequest {
        @NotNull(message = "Order ID is required")
        private UUID orderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitiatePaymentResponse {
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
    public static class VerifyPaymentRequest {
        @NotNull(message = "Order ID is required")
        private UUID orderId;

        @NotBlank(message = "Razorpay Order ID is required")
        private String razorpayOrderId;

        @NotBlank(message = "Razorpay Payment ID is required")
        private String razorpayPaymentId;

        private String razorpaySignature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyPaymentResponse {
        private boolean isSuccess;
        private String message;
        private UUID orderId;
    }
}
