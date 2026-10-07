package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.DuplicateIdentityConflictException;
import com.sporekart.identity.domain.IdentityProvider;
import com.sporekart.identity.domain.OtpType;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class FullMultiMethodLoginMatrixTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    private String fetchLatestOtpCode(String identifier, OtpType type) {
        return otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(identifier, type)
                .map(o -> o.getOtpCode())
                .orElseThrow(() -> new IllegalStateException("No active OTP found for identifier: " + identifier));
    }

    @Test
    @DisplayName("MATRIX-1: Google Login -> Link Primary Phone -> Logout -> Login via Primary Phone OTP (Unified Account)")
    void testGoogleLoginThenPhoneOtpLogin() {
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
        assertNull(googleResp.getPhone(), "Phone should be null initially");

        // 2. Link Primary Phone during checkout/profile update
        authService.linkPhoneAndNameFromAddress(googleResp.getUserId(), primaryPhone, "Ramesh Patel");

        // Verify updated profile
        AuthDtos.UserDto profile = authService.getUserProfile(googleResp.getUserId());
        assertEquals(primaryPhone, profile.getPhone());

        // 3. Simulated Logout (Client discards token) & Login via Primary Phone OTP
        authService.requestOtp(new AuthDtos.OtpRequest(primaryPhone), OtpType.CUSTOMER_AUTH);
        String otpCode = fetchLatestOtpCode(primaryPhone, OtpType.CUSTOMER_AUTH);

        AuthDtos.VerifyOtpRequest verifyReq = new AuthDtos.VerifyOtpRequest(primaryPhone, otpCode, "Ramesh", "Patil", "Ramesh Patel");
        AuthDtos.AuthResponse phoneOtpResp = authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH);

        // Assert: Same User ID, email preserved, multiple providers linked
        assertEquals(googleResp.getUserId(), phoneOtpResp.getUserId(), "Phone OTP login must return the exact same user ID as Google Auth");
        assertEquals(googleEmail, phoneOtpResp.getEmail(), "Account must retain pre-filled Google email");
        assertTrue(phoneOtpResp.getLinkedProviders().contains("GOOGLE"));
    }

    @Test
    @DisplayName("MATRIX-2: Phone OTP Login -> Link Email -> Logout -> Login via Google OAuth (Unified Account)")
    void testPhoneOtpLoginThenGoogleLogin() {
        String primaryPhone = "+919777766666";
        String emailToLink = "grower.matrix2@gmail.com";
        String googleSub = "google_sub_matrix_202";

        // 1. Phone OTP Initial Login
        authService.requestOtp(new AuthDtos.OtpRequest(primaryPhone), OtpType.CUSTOMER_AUTH);
        String otpCode = fetchLatestOtpCode(primaryPhone, OtpType.CUSTOMER_AUTH);
        AuthDtos.VerifyOtpRequest verifyReq = new AuthDtos.VerifyOtpRequest(primaryPhone, otpCode, "Suresh", "Kumar", "Suresh Kumar");
        AuthDtos.AuthResponse phoneResp = authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH);

        assertNotNull(phoneResp.getUserId());

        // 2. Link Email
        authService.linkEmailToUser(phoneResp.getUserId(), emailToLink);

        // 3. Logout & Login via Google OAuth using the linked email
        AuthDtos.GoogleOAuthRequest googleReq = AuthDtos.GoogleOAuthRequest.builder()
                .email(emailToLink)
                .googleSub(googleSub)
                .firstName("Suresh")
                .lastName("Kumar")
                .fullName("Suresh Kumar")
                .build();
        AuthDtos.AuthResponse googleResp = authService.loginWithGoogle(googleReq);

        // Assert: Identical User ID & providers unified
        assertEquals(phoneResp.getUserId(), googleResp.getUserId(), "Google login must unify with existing phone-created account when email matches");
        assertTrue(googleResp.getLinkedProviders().contains("GOOGLE"));
    }

    @Test
    @DisplayName("MATRIX-3 [Negative]: Cross-Account Primary Phone Hijacking Prevention")
    void testPhoneHijackingPrevention() {
        String userAPhone = "+919666655555";
        String userBEmail = "attacker.userb@gmail.com";

        // User A registers phone
        authService.requestOtp(new AuthDtos.OtpRequest(userAPhone), OtpType.CUSTOMER_AUTH);
        String otpCode = fetchLatestOtpCode(userAPhone, OtpType.CUSTOMER_AUTH);
        AuthDtos.AuthResponse userAResp = authService.verifyOtp(new AuthDtos.VerifyOtpRequest(userAPhone, otpCode, "User", "A", "User A"), OtpType.CUSTOMER_AUTH);

        // User B logs in with Google
        AuthDtos.GoogleOAuthRequest googleReqB = AuthDtos.GoogleOAuthRequest.builder()
                .email(userBEmail)
                .googleSub("google_sub_b_303")
                .firstName("User")
                .lastName("B")
                .fullName("User B")
                .build();
        AuthDtos.AuthResponse userBResp = authService.loginWithGoogle(googleReqB);

        // User B tries to hijack User A's phone number during address entry
        DuplicateIdentityConflictException exception = assertThrows(
                DuplicateIdentityConflictException.class,
                () -> authService.linkPhoneAndNameFromAddress(userBResp.getUserId(), userAPhone, "User B")
        );

        assertTrue(exception.getMessage().contains("already registered"));
        assertEquals("phone", exception.getConflictingField());

        // Verify User A remains owner of phone
        User userA = userRepository.findById(userAResp.getUserId()).orElseThrow();
        assertEquals(userAPhone, userA.getPhone());
    }

    @Test
    @DisplayName("MATRIX-4 [Negative]: Cross-Account Email Hijacking Prevention")
    void testEmailHijackingPrevention() {
        String userAEmail = "legit.userA@sporekart.in";
        String userBPhone = "+919555544444";

        // User A registers via Google
        AuthDtos.GoogleOAuthRequest googleReqA = AuthDtos.GoogleOAuthRequest.builder()
                .email(userAEmail)
                .googleSub("google_sub_a_404")
                .firstName("Legit")
                .lastName("User")
                .fullName("Legit User A")
                .build();
        authService.loginWithGoogle(googleReqA);

        // User B logs in via Phone OTP
        authService.requestOtp(new AuthDtos.OtpRequest(userBPhone), OtpType.CUSTOMER_AUTH);
        String otpCode = fetchLatestOtpCode(userBPhone, OtpType.CUSTOMER_AUTH);
        AuthDtos.AuthResponse userBResp = authService.verifyOtp(new AuthDtos.VerifyOtpRequest(userBPhone, otpCode, "User", "B", "User B"), OtpType.CUSTOMER_AUTH);

        // User B attempts to claim User A's email
        DuplicateIdentityConflictException exception = assertThrows(
                DuplicateIdentityConflictException.class,
                () -> authService.linkEmailToUser(userBResp.getUserId(), userAEmail)
        );

        assertTrue(exception.getMessage().contains("already registered"));
        assertEquals("email", exception.getConflictingField());
    }

    @Test
    @DisplayName("MATRIX-5 [Negative]: OTP Expiration & Replay Attack Security Enforcement")
    void testOtpExpirationAndReplayEnforcement() {
        String phone = "+919444433333";
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);
        String actualCode = fetchLatestOtpCode(phone, OtpType.CUSTOMER_AUTH);

        // 1. Manually expire OTP in repository
        otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(phone, OtpType.CUSTOMER_AUTH)
                .ifPresent(otp -> {
                    otp.setExpiresAt(LocalDateTime.now().minusMinutes(5));
                    otpRepository.save(otp);
                });

        // 2. Submit expired OTP -> Must throw expired exception
        AuthDtos.VerifyOtpRequest expiredReq = new AuthDtos.VerifyOtpRequest(phone, actualCode, "Tester", "Negative", "Tester Negative");
        Exception expError = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(expiredReq, OtpType.CUSTOMER_AUTH));
        assertTrue(expError.getMessage().toLowerCase().contains("expired") || expError.getMessage().contains("No active OTP"));

        // 3. Request fresh OTP & verify successfully
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);
        String validCode = fetchLatestOtpCode(phone, OtpType.CUSTOMER_AUTH);
        AuthDtos.VerifyOtpRequest validReq = new AuthDtos.VerifyOtpRequest(phone, validCode, "Tester", "Negative", "Tester Negative");
        authService.verifyOtp(validReq, OtpType.CUSTOMER_AUTH);

        // 4. Replay Attack Attempt (verifying second time with same OTP)
        Exception replayError = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(validReq, OtpType.CUSTOMER_AUTH));
        assertTrue(replayError.getMessage().toLowerCase().contains("used") || 
                   replayError.getMessage().toLowerCase().contains("expired") || 
                   replayError.getMessage().contains("No active OTP"));
    }

    @Test
    @DisplayName("MATRIX-6 [Negative]: Excessive Failed OTP Attempts Brute Force Protection")
    void testExcessiveFailedAttemptsProtection() {
        String phone = "+919333322222";
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        AuthDtos.VerifyOtpRequest wrongReq = new AuthDtos.VerifyOtpRequest(phone, "000000", "Attacker", "Brute", "Attacker Brute");

        // Fail 1
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        // Fail 2
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        // Fail 3 -> Marks consumed
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        
        // Fail 4 -> OTP is locked/consumed
        Exception maxErr = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        assertTrue(maxErr.getMessage().contains("No active OTP") || maxErr.getMessage().contains("used") || maxErr.getMessage().contains("exceeded"));
    }
}
