package com.sporekart.shipping.api;

import com.sporekart.shipping.domain.ShipmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class ShippingDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateShipmentRequest {
        @NotNull(message = "Order ID is required")
        private UUID orderId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipmentResponse {
        private UUID id;
        private UUID orderId;
        private String orderNumber;
        private String providerShipmentId;
        private String awbCode;
        private String courierName;
        private String courierId;
        private ShipmentStatus status;
        private ZonedDateTime pickupScheduledAt;
        private ZonedDateTime deliveredAt;
        private List<TrackingEventResponse> trackingEvents;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingEventResponse {
        private UUID id;
        private String awbCode;
        private String currentStatus;
        private String location;
        private String activity;
        private ZonedDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShiprocketWebhookPayload {
        private String awb;
        private String current_status;
        private String current_location;
        private String scans;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PincodeServiceabilityResponse {
        private String pincode;
        private boolean isServiceable;
        private Integer estimatedDeliveryDays;
        private java.math.BigDecimal shippingFeeInr;
        private String courierName;
        private String message;
    }
}
