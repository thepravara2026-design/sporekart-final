package com.sporekart.identity.api;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpRequest {
        @NotBlank(message = "Phone or email identifier is required")
        private String identifier;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyOtpRequest {
        @NotBlank(message = "Identifier is required")
        private String identifier;
        @NotBlank(message = "OTP code is required")
        private String otpCode;
        private String firstName;
        private String lastName;
        private String fullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleOAuthRequest {
        @NotBlank(message = "Google ID token or subject is required")
        private String googleSub;
        @NotBlank(message = "Email is required")
        private String email;
        private String firstName;
        private String lastName;
        private String fullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailChangeRequest {
        @NotBlank(message = "New email is required")
        private String newEmail;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyEmailChangeRequest {
        @NotBlank(message = "New email is required")
        private String newEmail;
        @NotBlank(message = "OTP code is required")
        private String otpCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private UUID userId;
        private String firstName;
        private String lastName;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private List<String> linkedProviders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private UUID id;
        private String firstName;
        private String lastName;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private boolean isEmailVerified;
        private boolean isPhoneVerified;
        private List<String> linkedProviders;
    }
}
