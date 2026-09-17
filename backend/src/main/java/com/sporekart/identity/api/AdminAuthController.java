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
    public ResponseEntity<ApiResponse<String>> requestAdminOtp(@Valid @RequestBody AuthDtos.OtpRequest request) {
        String otpCode = adminAuthService.requestAdminOtp(request);
        return ResponseEntity.ok(ApiResponse.success(otpCode));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> verifyAdminOtp(@Valid @RequestBody AuthDtos.VerifyOtpRequest request) {
        AuthDtos.AuthResponse response = adminAuthService.verifyAdminOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
