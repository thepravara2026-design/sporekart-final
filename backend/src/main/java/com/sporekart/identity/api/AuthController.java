package com.sporekart.identity.api;

import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.OtpType;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/otp/request")
    public ResponseEntity<ApiResponse<String>> requestOtp(@Valid @RequestBody AuthDtos.OtpRequest request) {
        authService.requestOtp(request, OtpType.CUSTOMER_AUTH);
        return ResponseEntity.ok(ApiResponse.success("OTP sent"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> verifyOtp(@Valid @RequestBody AuthDtos.VerifyOtpRequest request) {
        AuthDtos.AuthResponse response = authService.verifyOtp(request, OtpType.CUSTOMER_AUTH);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> loginWithGoogle(@Valid @RequestBody AuthDtos.GoogleOAuthRequest request) {
        AuthDtos.AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDtos.UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        AuthDtos.UserDto userProfile = authService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(userProfile));
    }
}
