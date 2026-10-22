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
        @jakarta.validation.constraints.Pattern(regexp = "^$|^[a-zA-Z0-9\\s\\.\\-]{2,60}$", message = "Full name must contain only letters, numbers, spaces, dots, or hyphens (min 2 characters)")
        private String fullName;

        @jakarta.validation.constraints.Pattern(regexp = "^$|^(?:\\+91[\\-\\s]?|0)?[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit Indian mobile number")
        private String phone;

        @jakarta.validation.constraints.Pattern(regexp = "^$|^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$", message = "Email must be a valid email address")
        private String email;

        private String gstin;

        @jakarta.validation.constraints.Min(value = 0, message = "Farm size cannot be negative")
        private Integer farmSizeSqft;

        private String line1;
        private String line2;
        private String city;
        private String state;

        @jakarta.validation.constraints.Pattern(regexp = "^$|^[1-9][0-9]{5}$", message = "PIN code must be a valid 6-digit Indian postal code")
        private String pincode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressRequest {
        @NotBlank(message = "Recipient name is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9\\s\\.\\-]{2,60}$", message = "Recipient name must contain only letters, numbers, spaces, dots, or hyphens (min 2 characters)")
        private String recipientName;

        @NotBlank(message = "Phone number is required")
        @jakarta.validation.constraints.Pattern(regexp = "^(?:\\+91[\\-\\s]?|0)?[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9")
        private String phone;

        @jakarta.validation.constraints.Pattern(regexp = "^$|^(?:\\+91[\\-\\s]?|0)?[6-9]\\d{9}$", message = "Alternative phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9")
        private String alternatePhone;

        @NotBlank(message = "Address line 1 is required")
        @jakarta.validation.constraints.Size(min = 5, message = "Address line 1 must be at least 5 characters long")
        private String line1;

        private String line2;

        @NotBlank(message = "City is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z\\s\\.\\-]{2,50}$", message = "City / District must contain only letters and spaces")
        private String city;

        @NotBlank(message = "State is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z\\s\\.\\-]{2,50}$", message = "State must contain only letters and spaces")
        private String state;

        @NotBlank(message = "PIN code is required")
        @jakarta.validation.constraints.Pattern(regexp = "^[1-9][0-9]{5}$", message = "PIN code must be a valid 6-digit Indian postal code (100000-999999)")
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
        private String alternatePhone;
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
