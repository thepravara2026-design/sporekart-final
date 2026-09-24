package com.sporekart.customer.api;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class CustomerDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String gstin;
        private Integer farmSizeSqft;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressRequest {
        @NotBlank(message = "Recipient name is required")
        private String recipientName;
        @NotBlank(message = "Phone is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[0-9+ \\-()]{8,15}$", message = "Invalid phone number format")
        private String phone;
        @NotBlank(message = "Address line 1 is required")
        private String line1;
        private String line2;
        @NotBlank(message = "City is required")
        private String city;
        @NotBlank(message = "State is required")
        private String state;
        @NotBlank(message = "PIN code is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[1-9][0-9]{5}$", message = "PIN code must be a valid 6-digit Indian postal code")
        private String pincode;
        private boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressDto {
        private UUID id;
        private UUID userId;
        private String recipientName;
        private String phone;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
        private boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CapabilityResponse {
        private UUID userId;
        private java.util.Set<com.sporekart.customer.domain.CustomerCapability> capabilities;
    }
}
