package com.sporekart.shipping.infrastructure.shiprocket;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class ShiprocketDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LoginResponse {
        private Long id;
        @JsonProperty("first_name")
        private String firstName;
        @JsonProperty("last_name")
        private String lastName;
        private String email;
        @JsonProperty("company_id")
        private Long companyId;
        @JsonProperty("created_at")
        private String createdAt;
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateAdhocOrderRequest {
        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("order_date")
        private String orderDate;

        @JsonProperty("pickup_location")
        private String pickupLocation;

        @JsonProperty("billing_customer_name")
        private String billingCustomerName;

        @JsonProperty("billing_last_name")
        private String billingLastName;

        @JsonProperty("billing_address")
        private String billingAddress;

        @JsonProperty("billing_address_2")
        private String billingAddress2;

        @JsonProperty("billing_city")
        private String billingCity;

        @JsonProperty("billing_pincode")
        private String billingPincode;

        @JsonProperty("billing_state")
        private String billingState;

        @JsonProperty("billing_country")
        private String billingCountry;

        @JsonProperty("billing_email")
        private String billingEmail;

        @JsonProperty("billing_phone")
        private String billingPhone;

        @JsonProperty("shipping_is_billing")
        @Builder.Default
        private boolean shippingIsBilling = true;

        @JsonProperty("order_items")
        private List<ShiprocketOrderItemDto> orderItems;

        @JsonProperty("payment_method")
        @Builder.Default
        private String paymentMethod = "Prepaid";

        @JsonProperty("sub_total")
        private BigDecimal subTotal;

        private BigDecimal length;
        private BigDecimal breadth;
        private BigDecimal height;
        private BigDecimal weight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ShiprocketOrderItemDto {
        private String name;
        private String sku;
        private int units;
        @JsonProperty("selling_price")
        private BigDecimal sellingPrice;
        @Builder.Default
        private String discount = "0";
        @Builder.Default
        private String tax = "0";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateOrderResponse {
        @JsonProperty("order_id")
        private Long orderId;

        @JsonProperty("shipment_id")
        private Long shipmentId;

        private String status;

        @JsonProperty("status_code")
        private Integer statusCode;

        @JsonProperty("message")
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AssignAwbRequest {
        @JsonProperty("shipment_id")
        private String shipmentId;

        @JsonProperty("courier_id")
        private String courierId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AssignAwbResponse {
        private ResponseData response;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ResponseData {
            private AwbData data;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class AwbData {
            @JsonProperty("awb_code")
            private String awbCode;

            @JsonProperty("courier_name")
            private String courierName;

            @JsonProperty("courier_company_id")
            private Long courierCompanyId;

            @JsonProperty("assigned_date_time")
            private String assignedDateTime;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeneratePickupRequest {
        @JsonProperty("shipment_id")
        private List<String> shipmentId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeneratePickupResponse {
        private PickupData response;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class PickupData {
            @JsonProperty("pickup_status")
            private Integer pickupStatus;

            private String data;

            @JsonProperty("pickup_token_number")
            private String pickupTokenNumber;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackAwbResponse {
        @JsonProperty("tracking_data")
        private TrackingData trackingData;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class TrackingData {
            @JsonProperty("track_status")
            private Integer trackStatus;

            @JsonProperty("shipment_status")
            private Integer shipmentStatus;

            @JsonProperty("shipment_track")
            private List<ShipmentTrack> shipmentTrack;

            @JsonProperty("shipment_track_activities")
            private List<TrackingActivity> shipmentTrackActivities;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ShipmentTrack {
            private Long id;

            @JsonProperty("current_status")
            private String currentStatus;

            private String origin;
            private String destination;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class TrackingActivity {
            private String date;
            private String status;
            private String activity;
            private String location;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CancelOrderRequest {
        private List<String> ids;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CancelOrderResponse {
        @JsonProperty("status_code")
        private Integer statusCode;

        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ServiceabilityResponse {
        private Integer status;
        private ServiceabilityData data;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ServiceabilityData {
            @JsonProperty("available_courier_companies")
            private List<AvailableCourierCompany> availableCourierCompanies;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class AvailableCourierCompany {
            @JsonProperty("courier_company_id")
            private Long courierCompanyId;

            @JsonProperty("courier_name")
            private String courierName;

            private BigDecimal rate;

            private String etd;

            @JsonProperty("estimated_delivery_days")
            private Integer estimatedDeliveryDays;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GenerateLabelResponse {
        @JsonProperty("label_created")
        private Integer labelCreated;

        @JsonProperty("label_url")
        private String labelUrl;
    }
}
