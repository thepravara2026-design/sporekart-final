package com.sporekart.identity.api;

import com.sporekart.identity.application.AuthService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final Environment environment;

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> loginWithGoogle(@Valid @RequestBody AuthDtos.GoogleOAuthRequest request) {
        AuthDtos.AuthResponse response = authService.loginWithGoogle(request);
        // Align cookie max-age (24h) with JWT expiration (24h = 86400 seconds)
        ResponseCookie cookie = ResponseCookie.from("sporekart_token", response.getToken())
                .httpOnly(true)
                .secure(environment == null || !environment.acceptsProfiles(Profiles.of("dev", "test")))
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("Lax")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        ResponseCookie cookie = ResponseCookie.from("sporekart_token", "")
                .httpOnly(true)
                .secure(environment == null || !environment.acceptsProfiles(Profiles.of("dev", "test")))
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Logged out successfully"));
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
