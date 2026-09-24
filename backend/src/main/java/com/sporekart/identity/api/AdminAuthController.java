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
        adminAuthService.requestAdminOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> verifyAdminOtp(@Valid @RequestBody AuthDtos.VerifyOtpRequest request) {
        AuthDtos.AuthResponse response = adminAuthService.verifyAdminOtp(request);
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("sporekart_token", response.getToken())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }
}
