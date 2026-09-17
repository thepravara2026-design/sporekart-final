package com.sporekart.shipping.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ShippingProvider {

    CreateShipmentResult createShipment(CreateShipmentCommand command);

    TrackingResult trackShipment(String awbCode, String providerShipmentId);

    CancelShipmentResult cancelShipment(String providerShipmentId, String awbCode);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class CreateShipmentCommand {
        private UUID orderId;
        private String orderNumber;
        private String recipientName;
        private String phone;
        private String email;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String pincode;
        private BigDecimal totalAmountInr;
        private List<ShipmentItemCommand> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class ShipmentItemCommand {
        private String title;
        private String sku;
        private int quantity;
        private BigDecimal priceInr;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class CreateShipmentResult {
        private String providerShipmentId;
        private String awbCode;
        private String courierName;
        private String courierId;
        private String status;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class TrackingResult {
        private String awbCode;
        private String currentStatus;
        private String location;
        private String activity;
        private String timestamp;
        private String rawResponseJson;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class CancelShipmentResult {
        private boolean isCancelled;
        private String message;
    }
}
