package com.sporekart.identity.application;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.domain.*;
import com.sporekart.identity.infrastructure.CustomerIdentityRepository;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceUnitTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private OtpRepository otpRepository;
    @Mock
    private CustomerIdentityRepository customerIdentityRepository;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AuthService authService;

    private String emailIdentifier;
    private String phoneIdentifier;
    private UUID userId;
    private User testUser;
    private JwtTokenProvider realJwtTokenProvider;

    private static final String VALID_BASE64_SECRET = "c3BvcmVrYXJ0LXNlY3JldC1rZXktZm9yLXRlc3RpbmctcHVycG9zZXMtMjU2Yml0cw=="; // 32+ bytes Base64

    @BeforeEach
    void setUp() {
        emailIdentifier = "user@example.com";
        phoneIdentifier = "9876543210";
        userId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email(emailIdentifier)
                .firstName("Mushroom")
                .lastName("Grower")
                .fullName("Mushroom Grower")
                .role(UserRole.ROLE_CUSTOMER)
                .isVerified(true)
                .isEmailVerified(true)
                .build();

        realJwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(realJwtTokenProvider, "jwtSecret", VALID_BASE64_SECRET);
        ReflectionTestUtils.setField(realJwtTokenProvider, "jwtExpirationMs", 3600000L);
    }

    @Test
    @DisplayName("AUTH-1: Request OTP fails when rate limit (>=3 requests in 10 mins) is exceeded")
    void AUTH_1_requestOtp_rateLimitExceeded() {
        when(otpRepository.countByIdentifierAndOtpTypeAndCreatedAtAfter(anyString(), any(), any()))
                .thenReturn(3);

        AuthDtos.OtpRequest request = new AuthDtos.OtpRequest();
        request.setIdentifier(emailIdentifier);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.requestOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("Rate limit exceeded"));
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("AUTH-2: Request OTP generates code and sends email notification")
    void AUTH_2_requestOtp_sendsNotification() {
        when(otpRepository.countByIdentifierAndOtpTypeAndCreatedAtAfter(anyString(), any(), any()))
                .thenReturn(0);
        when(otpRepository.save(any(Otp.class))).thenAnswer(i -> i.getArgument(0));

        AuthDtos.OtpRequest request = new AuthDtos.OtpRequest();
        request.setIdentifier(emailIdentifier);

        authService.requestOtp(request, OtpType.CUSTOMER_AUTH);

        verify(otpRepository).save(any(Otp.class));
        verify(notificationService).sendOtpEmail(eq(emailIdentifier), anyString());
    }

    @Test
    @DisplayName("AUTH-3: Verify OTP fails when no active OTP is found")
    void AUTH_3_verifyOtp_notFound() {
        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.empty());

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("No active OTP found"));
    }

    @Test
    @DisplayName("AUTH-4: Verify OTP fails when OTP is consumed or used")
    void AUTH_4_verifyOtp_alreadyUsed() {
        Otp consumedOtp = Otp.builder()
                .identifier(emailIdentifier)
                .otpCode("123456")
                .consumed(true)
                .isUsed(true)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(consumedOtp));

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("OTP has already been used"));
    }

    @Test
    @DisplayName("AUTH-5: Verify OTP fails when OTP is expired")
    void AUTH_5_verifyOtp_expired() {
        Otp expiredOtp = Otp.builder()
                .identifier(emailIdentifier)
                .otpCode("123456")
                .consumed(false)
                .isUsed(false)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(expiredOtp));

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("OTP has expired"));
    }

    @Test
    @DisplayName("AUTH-6: Verify OTP fails on incorrect code and increments attempt count")
    void AUTH_6_verifyOtp_incorrectCode() {
        Otp otp = Otp.builder()
                .identifier(emailIdentifier)
                .otpCode("123456")
                .consumed(false)
                .isUsed(false)
                .attemptCount(1)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(otp));

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("999999");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("Invalid OTP code provided"));
        assertEquals(2, otp.getAttemptCount());
        verify(otpRepository).save(otp);
    }

    @Test
    @DisplayName("AUTH-7: Verify OTP locks/consumes OTP when max attempts (3) reached")
    void AUTH_7_verifyOtp_maxAttemptsReached() {
        Otp otp = Otp.builder()
                .identifier(emailIdentifier)
                .otpCode("123456")
                .consumed(false)
                .isUsed(false)
                .attemptCount(3)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(otp));

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyOtp(request, OtpType.CUSTOMER_AUTH)
        );
        assertTrue(ex.getMessage().contains("Maximum OTP verification attempts exceeded"));
        assertTrue(otp.isConsumed());
        verify(otpRepository).save(otp);
    }

    @Test
    @DisplayName("AUTH-8: Verify OTP succeeds and returns AuthResponse with token")
    void AUTH_8_verifyOtp_success() {
        Otp otp = Otp.builder()
                .identifier(emailIdentifier)
                .otpCode("123456")
                .consumed(false)
                .isUsed(false)
                .attemptCount(0)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(otp));
        when(userRepository.findByEmail(emailIdentifier)).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("mock-jwt-token");
        when(customerIdentityRepository.findByUserId(userId)).thenReturn(Collections.emptyList());

        AuthDtos.VerifyOtpRequest request = new AuthDtos.VerifyOtpRequest();
        request.setIdentifier(emailIdentifier);
        request.setOtpCode("123456");

        AuthDtos.AuthResponse response = authService.verifyOtp(request, OtpType.CUSTOMER_AUTH);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(userId, response.getUserId());
        assertTrue(otp.isConsumed());
        assertTrue(otp.isUsed());
    }

    @Test
    @DisplayName("AUTH-9: Login with Google OAuth returns AuthResponse")
    void AUTH_9_loginWithGoogle_success() {
        AuthDtos.GoogleOAuthRequest request = new AuthDtos.GoogleOAuthRequest();
        request.setEmail(emailIdentifier);
        request.setGoogleSub("google-sub-123");
        request.setFirstName("Google");
        request.setLastName("User");

        when(userRepository.findByEmail(emailIdentifier)).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("google-jwt-token");
        when(customerIdentityRepository.findByUserId(userId)).thenReturn(Collections.emptyList());

        AuthDtos.AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("google-jwt-token", response.getToken());
        verify(customerIdentityRepository).save(any(CustomerIdentity.class));
    }

    @Test
    @DisplayName("AUTH-10: Find or create user links existing email user with new provider")
    void AUTH_10_findOrCreateUser_linksExistingEmail() {
        when(customerIdentityRepository.findByProviderAndProviderSubject(IdentityProvider.GOOGLE, "google-sub-456"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(emailIdentifier)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User user = authService.findOrCreateUserForIdentity(
                IdentityProvider.GOOGLE, "google-sub-456", emailIdentifier, "Test", "User", "Test User"
        );

        assertEquals(testUser, user);
        verify(customerIdentityRepository).save(any(CustomerIdentity.class));
    }

    @Test
    @DisplayName("AUTH-11: Find user by phone flexible matches +91 or raw 10 digits")
    void AUTH_11_findUserByPhoneFlexible() {
        User phoneUser = User.builder().id(UUID.randomUUID()).phone("+919876543210").build();
        when(userRepository.findByPhone("9876543210")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("+919876543210")).thenReturn(Optional.of(phoneUser));

        Optional<User> result = authService.findUserByPhoneFlexible("9876543210");

        assertTrue(result.isPresent());
        assertEquals("+919876543210", result.get().getPhone());
    }

    @Test
    @DisplayName("AUTH-12: Normalize phone prepends +91 to 10-digit Indian numbers")
    void AUTH_12_normalizePhone() {
        assertEquals("+919876543210", AuthService.normalizePhone("9876543210"));
        assertEquals("+919876543210", AuthService.normalizePhone("+919876543210"));
        assertNull(AuthService.normalizePhone(null));
        assertNull(AuthService.normalizePhone("  "));
    }

    @Test
    @DisplayName("AUTH-13: Link phone to user creates phone customer identity")
    void AUTH_13_linkPhoneToUser() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());
        when(customerIdentityRepository.findByProviderAndProviderSubject(any(), any()))
                .thenReturn(Optional.empty());

        authService.linkPhoneToUser(userId, "9876543210");

        assertEquals("+919876543210", testUser.getPhone());
        assertTrue(testUser.isPhoneVerified());
        verify(customerIdentityRepository).save(any(CustomerIdentity.class));
    }

    @Test
    @DisplayName("AUTH-14: Link email to user creates email customer identity")
    void AUTH_14_linkEmailToUser() {
        User noEmailUser = User.builder().id(userId).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(noEmailUser));
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(customerIdentityRepository.findByProviderAndProviderSubject(any(), any()))
                .thenReturn(Optional.empty());

        authService.linkEmailToUser(userId, "new@example.com");

        assertEquals("new@example.com", noEmailUser.getEmail());
        assertTrue(noEmailUser.isEmailVerified());
        verify(customerIdentityRepository).save(any(CustomerIdentity.class));
    }

    @Test
    @DisplayName("AUTH-15: Get user profile returns UserDto with linked providers")
    void AUTH_15_getUserProfile() {
        CustomerIdentity identity = CustomerIdentity.builder()
                .userId(userId)
                .provider(IdentityProvider.GOOGLE)
                .providerSubject("sub-123")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(customerIdentityRepository.findByUserId(userId)).thenReturn(List.of(identity));

        AuthDtos.UserDto dto = authService.getUserProfile(userId);

        assertNotNull(dto);
        assertEquals(userId, dto.getId());
        assertEquals("user@example.com", dto.getEmail());
        assertTrue(dto.getLinkedProviders().contains("GOOGLE"));
    }

    @Test
    @DisplayName("AUTH-16: JwtTokenProvider validateSecret throws exception if secret is blank or short")
    void AUTH_16_jwtTokenProvider_validateSecret() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "short");

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::validateSecret);
        assertTrue(ex.getMessage().contains("Base64") || ex.getMessage().contains("32 bytes"));
    }

    @Test
    @DisplayName("AUTH-17: JwtTokenProvider generateToken creates valid JWT")
    void AUTH_17_jwtTokenProvider_generateToken() {
        realJwtTokenProvider.validateSecret();

        String token = realJwtTokenProvider.generateToken(userId, emailIdentifier, "ROLE_CUSTOMER");

        assertNotNull(token);
        assertTrue(realJwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("AUTH-18: JwtTokenProvider getUserIdFromToken extracts subject UUID correctly")
    void AUTH_18_jwtTokenProvider_getUserIdFromToken() {
        realJwtTokenProvider.validateSecret();
        String token = realJwtTokenProvider.generateToken(userId, emailIdentifier, "ROLE_CUSTOMER");

        String extractedId = realJwtTokenProvider.getUserIdFromToken(token);

        assertEquals(userId.toString(), extractedId);
    }

    @Test
    @DisplayName("AUTH-19: JwtTokenProvider getAuthentication builds Authentication object with authorities")
    void AUTH_19_jwtTokenProvider_getAuthentication() {
        realJwtTokenProvider.validateSecret();
        String token = realJwtTokenProvider.generateToken(userId, emailIdentifier, "ROLE_ADMIN");

        Authentication auth = realJwtTokenProvider.getAuthentication(token);

        assertNotNull(auth);
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("AUTH-20: JwtTokenProvider validateToken returns false for invalid token")
    void AUTH_20_jwtTokenProvider_validateToken_invalid() {
        realJwtTokenProvider.validateSecret();

        assertFalse(realJwtTokenProvider.validateToken("invalid.jwt.token"));
    }
}
