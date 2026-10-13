package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class FullMultiMethodLoginMatrixTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("MATRIX-1: Google Login -> Link Primary Phone for Checkout -> Profile Verification")
    void testGoogleLoginThenPhoneLinking() {
        String googleEmail = "grower.matrix1@gmail.com";
        String googleSub = "google_sub_matrix_101";
        String primaryPhone = "+919888877777";

        // 1. Google OAuth Initial Login
        AuthDtos.GoogleOAuthRequest googleReq = AuthDtos.GoogleOAuthRequest.builder()
                .email(googleEmail)
                .googleSub(googleSub)
                .firstName("Ramesh")
                .lastName("Patel")
                .fullName("Ramesh Patel")
                .build();
        AuthDtos.AuthResponse googleResp = authService.loginWithGoogle(googleReq);

        assertNotNull(googleResp.getToken());
        assertEquals(googleEmail, googleResp.getEmail());

        // 2. Link Phone Number for Delivery/Checkout Contact
        authService.linkPhoneToUser(googleResp.getUserId(), primaryPhone);

        // 3. Verify Profile Output
        AuthDtos.UserDto profile = authService.getUserProfile(googleResp.getUserId());
        assertEquals("+919888877777", profile.getPhone());
        assertEquals(googleEmail, profile.getEmail());
    }

    @Test
    @DisplayName("MATRIX-2: Duplicate Email Validation across Accounts")
    void testDuplicateEmailValidation() {
        User user1 = User.builder()
                .email("user1@example.com")
                .fullName("User One")
                .build();
        userRepository.save(user1);

        assertThrows(com.sporekart.identity.domain.DuplicateIdentityConflictException.class, () ->
                authService.validateEmailUniqueness(null, "user1@example.com")
        );
    }
}
