package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.DuplicateIdentityConflictException;
import com.sporekart.identity.domain.IdentityProvider;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
public class AccountUniformityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        // User 1 logs in via Email/Google (user1@gmail.com)
        AuthDtos.GoogleOAuthRequest googleReq1 = AuthDtos.GoogleOAuthRequest.builder()
                .email("user1@gmail.com")
                .googleSub("google_sub_user1_12345")
                .firstName("User One")
                .lastName("Tester")
                .fullName("User One Tester")
                .build();
        AuthDtos.AuthResponse resp1 = authService.loginWithGoogle(googleReq1);
        user1 = userRepository.findById(resp1.getUserId()).orElseThrow();

        // User 1 fills details during checkout/enrollment, saving phone number +919999999999
        authService.linkPhoneAndNameFromAddress(user1.getId(), "9999999999", "User One Tester");

        // User 2 logs in via Google/OAuth with a different email (user2@gmail.com)
        AuthDtos.GoogleOAuthRequest googleReq2 = AuthDtos.GoogleOAuthRequest.builder()
                .email("user2@gmail.com")
                .googleSub("google_sub_user2_67890")
                .firstName("User Two")
                .lastName("Tester")
                .fullName("User Two Tester")
                .build();
        AuthDtos.AuthResponse resp2 = authService.loginWithGoogle(googleReq2);
        user2 = userRepository.findById(resp2.getUserId()).orElseThrow();
    }

    @Test
    @DisplayName("User 1 successfully owns user1@gmail.com and +919999999999")
    void testUser1Ownership() {
        User fetchedUser1 = userRepository.findById(user1.getId()).orElseThrow();
        assertEquals("user1@gmail.com", fetchedUser1.getEmail());
        assertEquals("+919999999999", fetchedUser1.getPhone());
    }

    @Test
    @DisplayName("User 2 entering User 1's phone number 9999999999 during checkout/enrollment must throw DuplicateIdentityConflictException")
    void testUser2DuplicatePhoneConflict() {
        // User 2 tries to link 9999999999 during checkout, enrollment, or profile update
        DuplicateIdentityConflictException exception = assertThrows(
                DuplicateIdentityConflictException.class,
                () -> authService.linkPhoneAndNameFromAddress(user2.getId(), "9999999999", "User Two Tester")
        );

        assertTrue(exception.getMessage().contains("already registered"));
        assertEquals("phone", exception.getConflictingField());
        assertEquals("+919999999999", exception.getConflictingValue());
    }

    @Test
    @DisplayName("User 2 entering User 1's email user1@gmail.com must throw DuplicateIdentityConflictException")
    void testUser2DuplicateEmailConflict() {
        DuplicateIdentityConflictException exception = assertThrows(
                DuplicateIdentityConflictException.class,
                () -> authService.linkEmailToUser(user2.getId(), "user1@gmail.com")
        );

        assertTrue(exception.getMessage().contains("already registered"));
        assertEquals("email", exception.getConflictingField());
        assertEquals("user1@gmail.com", exception.getConflictingValue());
    }
}
