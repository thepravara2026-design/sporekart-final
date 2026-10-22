package com.sporekart.payment.api;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
        private Long amount; // Amount in paise (minimum 100)
        private String currency; // Defaults to "INR"
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
        @JsonProperty("order_id")
        @JsonAlias({"razorpay_order_id", "razorpayOrderId"})
        private String orderId;

        @JsonProperty("payment_id")
        @JsonAlias({"razorpay_payment_id", "razorpayPaymentId"})
        private String paymentId;

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
