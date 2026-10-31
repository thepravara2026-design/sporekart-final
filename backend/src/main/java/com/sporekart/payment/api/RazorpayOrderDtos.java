package com.sporekart.payment.api;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class RazorpayOrderDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateOrderRequest {
        @NotNull(message = "Amount in paise is required")
        @Positive(message = "Amount must be strictly positive")
        @Min(value = 100, message = "Minimum amount is 100 paise (₹1.00)")
        @Max(value = 100_000_000L, message = "Maximum single order amount is ₹1,000,000")
        private Long amount; // Amount in paise (minimum 100)

        @Size(max = 10, message = "Currency code must not exceed 10 characters")
        private String currency; // Defaults to "INR"

        @Size(max = 100, message = "Receipt identifier must not exceed 100 characters")
        private String receipt;

        @JsonProperty("order_id")
        @JsonAlias({"orderId", "sporekartOrderId"})
        private UUID orderId; // Optional internal Sporekart order ID
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateOrderResponse {
        @JsonProperty("order_id")
        private String orderId;

        private Long amount;
        private String currency;

        @JsonProperty("key_id")
        private String keyId;

        private String receipt;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StandardVerifyPaymentRequest {
        @NotNull(message = "Razorpay order ID is required")
        @Size(min = 1, max = 100, message = "Razorpay order ID length invalid")
        @JsonProperty("order_id")
        @JsonAlias({"razorpay_order_id", "razorpayOrderId"})
        private String orderId;

        @NotNull(message = "Razorpay payment ID is required")
        @Size(min = 1, max = 100, message = "Razorpay payment ID length invalid")
        @JsonProperty("payment_id")
        @JsonAlias({"razorpay_payment_id", "razorpayPaymentId"})
        private String paymentId;

        @NotNull(message = "Razorpay signature is required")
        @Size(min = 1, max = 255, message = "Razorpay signature length invalid")
        @JsonProperty("signature")
        @JsonAlias({"razorpay_signature", "razorpaySignature"})
        private String signature;

        @JsonProperty("sporekart_order_id")
        @JsonAlias({"internalOrderId", "sporekartOrderId"})
        private UUID sporekartOrderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StandardVerifyPaymentResponse {
        private String status; // "success" or "failure"
        private String message;
        private boolean verified;

        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("payment_id")
        private String paymentId;
    }
}
