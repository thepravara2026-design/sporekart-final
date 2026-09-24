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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummaryResponse {
        private String type; // "ORDER" or "ENROLLMENT"
        private UUID id;
        private String title;
        private String subtitle;
        private BigDecimal amountInr;
        private String status;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyEnrollmentPaymentRequest {
        @NotNull(message = "Enrollment ID is required")
        private UUID enrollmentId;

        @NotBlank(message = "Payment method is required")
        private String paymentMethod;

        private String transactionReference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyEnrollmentPaymentResponse {
        private boolean isSuccess;
        private String message;
        private UUID enrollmentId;
        private String paymentReference;
    }
}
