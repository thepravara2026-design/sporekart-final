package com.sporekart.identity.api;

import com.sporekart.identity.application.AdminAuthService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/otp/request")
    public ResponseEntity<ApiResponse<String>> requestAdminOtp(@RequestBody(required = false) AuthDtos.OtpRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("AUTH_METHOD_RETIRED", "Admin OTP authentication has been retired. Please sign in with Google using an authorized admin account."));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> verifyAdminOtp(@RequestBody(required = false) AuthDtos.VerifyOtpRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("AUTH_METHOD_RETIRED", "Admin OTP authentication has been retired. Please sign in with Google using an authorized admin account."));
    }
}
