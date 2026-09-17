package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AdminAuthService;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.CustomerIdentity;
import com.sporekart.identity.domain.IdentityProvider;
import com.sporekart.identity.domain.OtpType;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.CustomerIdentityRepository;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class IdentitySecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private CustomerIdentityRepository customerIdentityRepository;

    @BeforeEach
    void setUp() {
        customerIdentityRepository.deleteAll();
        otpRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testValidOtpVerification() {
        String phone = "+919876543210";
        String otpCode = authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        AuthDtos.VerifyOtpRequest verifyReq = new AuthDtos.VerifyOtpRequest(phone, otpCode, "Ramesh", "Patil", "Ramesh Patil");
        AuthDtos.AuthResponse response = authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("ROLE_CUSTOMER", response.getRole());
        assertEquals(phone, response.getPhone());
    }

    @Test
    void testExpiredOtpRejection() {
        String phone = "+919876543211";
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        // Manually expire the OTP in repository
        otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(phone, OtpType.CUSTOMER_AUTH)
                .ifPresent(otp -> {
                    otp.setExpiresAt(LocalDateTime.now().minusMinutes(1));
                    otpRepository.save(otp);
                });

        AuthDtos.VerifyOtpRequest verifyReq = new AuthDtos.VerifyOtpRequest(phone, "123456", "Ramesh", "Patil", "Ramesh Patil");
        Exception exception = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH));
        assertTrue(exception.getMessage().contains("expired"));
    }

    @Test
    void testReusedOtpRejection() {
        String phone = "+919876543212";
        String otpCode = authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        AuthDtos.VerifyOtpRequest verifyReq = new AuthDtos.VerifyOtpRequest(phone, otpCode, "Ramesh", "Patil", "Ramesh Patil");
        authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH);

        // Attempt second verification with same OTP code (Replay Attack)
        Exception exception = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(verifyReq, OtpType.CUSTOMER_AUTH));
        assertTrue(exception.getMessage().contains("already been used") || exception.getMessage().contains("No active OTP"));
    }

    @Test
    void testExcessiveAttemptsLimit() {
        String phone = "+919876543213";
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        AuthDtos.VerifyOtpRequest wrongReq = new AuthDtos.VerifyOtpRequest(phone, "000000", "Ramesh", "Patil", "Ramesh Patil");

        // Fail 3 times
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));

        // 4th attempt must be rejected due to attempt limit
        Exception exception = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(wrongReq, OtpType.CUSTOMER_AUTH));
        assertTrue(exception.getMessage().contains("exceeded") || exception.getMessage().contains("No active OTP"));
    }

    @Test
    void testRateLimiting() {
        String phone = "+919876543214";
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);
        authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH);

        // 4th request within 10 minutes must fail
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                authService.requestOtp(new AuthDtos.OtpRequest(phone), OtpType.CUSTOMER_AUTH)
        );
        assertTrue(exception.getMessage().contains("Rate limit exceeded"));
    }

    @Test
    void testDuplicateIdentityPreventionAndLinking() {
        String email = "grower@sporekart.in";

        // 1. Email OTP auth creates user & links EMAIL_OTP identity
        String otpCode = authService.requestOtp(new AuthDtos.OtpRequest(email), OtpType.CUSTOMER_AUTH);
        AuthDtos.AuthResponse res1 = authService.verifyOtp(new AuthDtos.VerifyOtpRequest(email, otpCode, "Suresh", "Kumar", "Suresh Kumar"), OtpType.CUSTOMER_AUTH);

        // 2. Google OAuth auth with same email links GOOGLE identity to SAME user
        AuthDtos.GoogleOAuthRequest googleReq = new AuthDtos.GoogleOAuthRequest("google_sub_12345", email, "Suresh", "Kumar", "Suresh Kumar");
        AuthDtos.AuthResponse res2 = authService.loginWithGoogle(googleReq);

        assertEquals(res1.getUserId(), res2.getUserId(), "Must link to the same customer account without creating duplicate accounts");

        List<CustomerIdentity> identities = customerIdentityRepository.findByUserId(res1.getUserId());
        assertEquals(2, identities.size(), "Customer account should have 2 linked identity providers");
    }

    @Test
    void testAdminAuthIsolationAndPrivilegeEscalationPrevention() {
        String customerEmail = "customer@sporekart.in";
        User customer = User.builder()
                .email(customerEmail)
                .fullName("Regular Customer")
                .role(UserRole.ROLE_CUSTOMER)
                .build();
        userRepository.save(customer);

        // Customer identifier cannot request Admin OTP
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                adminAuthService.requestAdminOtp(new AuthDtos.OtpRequest(customerEmail))
        );
        assertTrue(exception.getMessage().contains("Access Denied"));

        // Create authorized Admin User
        String adminEmail = "admin@sporekart.in";
        User admin = User.builder()
                .email(adminEmail)
                .fullName("Super Admin")
                .role(UserRole.ROLE_ADMIN)
                .build();
        userRepository.save(admin);

        String adminOtp = adminAuthService.requestAdminOtp(new AuthDtos.OtpRequest(adminEmail));
        AuthDtos.AuthResponse adminRes = adminAuthService.verifyAdminOtp(new AuthDtos.VerifyOtpRequest(adminEmail, adminOtp, null, null, null));

        assertNotNull(adminRes);
        assertEquals("ROLE_ADMIN", adminRes.getRole());
    }
}
