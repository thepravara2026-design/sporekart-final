package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.application.GoogleTokenClaims;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.CustomerIdentityRepository;
import com.sporekart.identity.infrastructure.TestGoogleIdTokenVerifier;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class GoogleLoginSecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerIdentityRepository customerIdentityRepository;

    @Autowired
    private TestGoogleIdTokenVerifier testGoogleIdTokenVerifier;

    @BeforeEach
    void setUp() {
        testGoogleIdTokenVerifier.clearTokens();
        customerIdentityRepository.deleteAll();
        userRepository.deleteAll();
        ReflectionTestUtils.setField(authService, "adminEmails", "thepravara2026@gmail.com,admin@sporekart.in");
    }

    @Test
    @DisplayName("SEC-GOOG-01: Reject request when ID token is null or blank")
    void testMissingIdTokenRejected() {
        AuthDtos.GoogleOAuthRequest req = new AuthDtos.GoogleOAuthRequest();
        req.setIdToken(null);
        req.setEmail("attacker@example.com");
        req.setGoogleSub("sub_9999");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(req));
        assertTrue(ex.getMessage().contains("Google ID token is required"));

        req.setIdToken("   ");
        assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(req));
    }

    @Test
    @DisplayName("SEC-GOOG-02: Reject forged or invalid token signature")
    void testForgedTokenRejected() {
        AuthDtos.GoogleOAuthRequest req = new AuthDtos.GoogleOAuthRequest();
        req.setIdToken("forged_signature_token");
        req.setEmail("legit@example.com");
        req.setGoogleSub("sub_legit");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(req));
        assertTrue(ex.getMessage().contains("Invalid Google ID token"));
    }

    @Test
    @DisplayName("SEC-GOOG-03: Reject token when email_verified is false")
    void testUnverifiedEmailRejected() {
        String token = "unverified_email_token";
        testGoogleIdTokenVerifier.registerToken(token, new GoogleTokenClaims(
                "sub_unverified", "unverified@example.com", false, "Unverified User", "Unverified", "User", null
        ));

        AuthDtos.GoogleOAuthRequest req = new AuthDtos.GoogleOAuthRequest();
        req.setIdToken(token);
        req.setEmail("unverified@example.com");
        req.setGoogleSub("sub_unverified");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(req));
        assertTrue(ex.getMessage().contains("email is not verified"));
    }

    @Test
    @DisplayName("SEC-GOOG-04: Reject token with mismatched audience or expired timestamp")
    void testMismatchedAudienceOrExpiredTokenRejected() {
        AuthDtos.GoogleOAuthRequest reqAud = new AuthDtos.GoogleOAuthRequest();
        reqAud.setIdToken("mismatched_aud_token");
        assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(reqAud));

        AuthDtos.GoogleOAuthRequest reqExp = new AuthDtos.GoogleOAuthRequest();
        reqExp.setIdToken("expired_token");
        assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(reqExp));
    }

    @Test
    @DisplayName("SEC-GOOG-05: Identity extracted strictly from verified token, ignoring request body tampering")
    void testIdentityExtractedFromVerifiedTokenOnly() {
        String token = "valid_token_victim";
        String tokenEmail = "victim@company.com";
        String tokenSub = "google_sub_victim_123";

        testGoogleIdTokenVerifier.registerToken(token, new GoogleTokenClaims(
                tokenSub, tokenEmail, true, "Victim User", "Victim", "User", null
        ));

        // Attacker attempts to claim admin@sporekart.in in the request body
        AuthDtos.GoogleOAuthRequest req = new AuthDtos.GoogleOAuthRequest();
        req.setIdToken(token);
        req.setEmail("admin@sporekart.in"); // Tampered body
        req.setGoogleSub("attacker_sub_999"); // Tampered body
        req.setFullName("Attacker Impersonator");

        AuthDtos.AuthResponse response = authService.loginWithGoogle(req);

        assertNotNull(response);
        // The authenticated identity MUST be the victim from the token, NOT the tampered body
        assertEquals(tokenEmail, response.getEmail());
        assertEquals("ROLE_CUSTOMER", response.getRole());

        // Verify database user record
        User user = userRepository.findByEmail(tokenEmail).orElseThrow();
        assertEquals(tokenEmail, user.getEmail());
        assertFalse(userRepository.findByEmail("admin@sporekart.in").isPresent());
    }

    @Test
    @DisplayName("SEC-GOOG-06: Configured admin email granted ROLE_ADMIN, non-admin gets ROLE_CUSTOMER")
    void testAdminEmailsConfigEnforced() {
        String adminToken = "token_admin";
        testGoogleIdTokenVerifier.registerToken(adminToken, new GoogleTokenClaims(
                "sub_admin_1", "thepravara2026@gmail.com", true, "Pravara Admin", "Pravara", "Admin", null
        ));

        AuthDtos.GoogleOAuthRequest adminReq = new AuthDtos.GoogleOAuthRequest();
        adminReq.setIdToken(adminToken);
        AuthDtos.AuthResponse adminResp = authService.loginWithGoogle(adminReq);

        assertEquals("ROLE_ADMIN", adminResp.getRole());

        String userToken = "token_regular_user";
        testGoogleIdTokenVerifier.registerToken(userToken, new GoogleTokenClaims(
                "sub_user_2", "regular.user@example.com", true, "Regular User", "Regular", "User", null
        ));

        AuthDtos.GoogleOAuthRequest userReq = new AuthDtos.GoogleOAuthRequest();
        userReq.setIdToken(userToken);
        AuthDtos.AuthResponse userResp = authService.loginWithGoogle(userReq);

        assertEquals("ROLE_CUSTOMER", userResp.getRole());
    }
}
