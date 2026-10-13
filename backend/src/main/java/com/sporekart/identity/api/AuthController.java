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
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/otp/request")
    public ResponseEntity<ApiResponse<String>> requestOtp(@RequestBody(required = false) AuthDtos.OtpRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("AUTH_METHOD_RETIRED", "Email and Phone OTP authentication have been retired. Please sign in with Google."));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> verifyOtp(@RequestBody(required = false) AuthDtos.VerifyOtpRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("AUTH_METHOD_RETIRED", "Email and Phone OTP authentication have been retired. Please sign in with Google."));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> loginWithGoogle(@Valid @RequestBody AuthDtos.GoogleOAuthRequest request) {
        AuthDtos.AuthResponse response = authService.loginWithGoogle(request);
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
