package com.sporekart.identity;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.CustomerIdentityRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class IdentitySecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerIdentityRepository customerIdentityRepository;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        customerIdentityRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testGoogleOAuthLoginNewUser() {
        String email = "googleuser@example.com";
        AuthDtos.GoogleOAuthRequest googleReq = new AuthDtos.GoogleOAuthRequest("google_sub_1001", email, "Google", "User", "Google User");

        AuthDtos.AuthResponse response = authService.loginWithGoogle(googleReq);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("ROLE_CUSTOMER", response.getRole());
        assertEquals(email, response.getEmail());
    }

    @Test
    void testGoogleOAuthLoginExistingAdminRolePreservation() {
        String adminEmail = "thepravara2026@gmail.com";
        User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> 
            userRepository.save(User.builder()
                .email(adminEmail)
                .fullName("Sporekart Admin")
                .role(UserRole.ROLE_ADMIN)
                .isVerified(true)
                .isEmailVerified(true)
                .build())
        );

        AuthDtos.GoogleOAuthRequest googleReq = new AuthDtos.GoogleOAuthRequest("google_admin_sub_999", adminEmail, "Sporekart", "Admin", "Sporekart Admin");
        AuthDtos.AuthResponse response = authService.loginWithGoogle(googleReq);

        assertNotNull(response);
        assertEquals("ROLE_ADMIN", response.getRole(), "Existing admin role must be preserved when logging in with Google OAuth");
    }

    @Test
    void testRetiredOtpEndpointsReturn410Gone() throws Exception {
        mockMvc.perform(post("/auth/otp/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"user@example.com\"}"))
                .andExpect(status().isGone());

        mockMvc.perform(post("/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"user@example.com\",\"otpCode\":\"123456\"}"))
                .andExpect(status().isGone());

        mockMvc.perform(post("/admin/auth/otp/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"admin@sporekart.in\"}"))
                .andExpect(status().isGone());

        mockMvc.perform(post("/admin/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"admin@sporekart.in\",\"otpCode\":\"123456\"}"))
                .andExpect(status().isGone());
    }

    @Test
    void testGoogleAuthHttpOnlyCookieAndMeEndpoint() throws Exception {
        AuthDtos.GoogleOAuthRequest googleReq = new AuthDtos.GoogleOAuthRequest("google_sub_2002", "cookietest@example.com", "Cookie", "User", "Cookie User");

        var mvcResult = mockMvc.perform(post("/auth/oauth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"googleSub\":\"google_sub_2002\",\"email\":\"cookietest@example.com\",\"fullName\":\"Cookie User\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String setCookie = mvcResult.getResponse().getHeader("Set-Cookie");
        assertNotNull(setCookie, "Set-Cookie header must be present on Google OAuth login response");
        assertTrue(setCookie.contains("sporekart_token="), "Set-Cookie header must contain sporekart_token");

        String cookieVal = setCookie.substring(setCookie.indexOf("sporekart_token=") + 16);
        if (cookieVal.contains(";")) {
            cookieVal = cookieVal.substring(0, cookieVal.indexOf(";"));
        }

        mockMvc.perform(get("/auth/me")
                        .cookie(new jakarta.servlet.http.Cookie("sporekart_token", cookieVal)))
                .andExpect(status().isOk());
    }
}
