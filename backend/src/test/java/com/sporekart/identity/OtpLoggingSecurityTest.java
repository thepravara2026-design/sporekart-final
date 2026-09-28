package com.sporekart.identity;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AdminAuthService;
import com.sporekart.identity.application.AuthService;
import com.sporekart.identity.domain.OtpType;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class OtpLoggingSecurityTest {

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @BeforeEach
    void setUp() {
        otpRepository.deleteAll();
    }

    @Test
    void testNoOtpCodeLoggedForAdminOrCustomerAuth() {
        String adminEmail = "admin-logging-test@sporekart.in";
        User admin = userRepository.findByEmail(adminEmail).orElseGet(() ->
            userRepository.save(User.builder()
                .email(adminEmail)
                .phone("+919999999900")
                .firstName("Admin")
                .lastName("User")
                .fullName("Admin User")
                .role(UserRole.ROLE_ADMIN)
                .isVerified(true)
                .build())
        );

        Logger adminLogger = (Logger) LoggerFactory.getLogger(AdminAuthService.class);
        Logger authLogger = (Logger) LoggerFactory.getLogger(AuthService.class);

        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        adminLogger.addAppender(appender);
        authLogger.addAppender(appender);

        AuthDtos.OtpRequest adminReq = new AuthDtos.OtpRequest(adminEmail);
        AuthDtos.OtpRequest customerReq = new AuthDtos.OtpRequest("customer@example.com");

        adminAuthService.requestAdminOtp(adminReq);
        authService.requestOtp(customerReq, OtpType.CUSTOMER_AUTH);

        List<ILoggingEvent> logs = appender.list;
        for (ILoggingEvent event : logs) {
            String message = event.getFormattedMessage();
            assertFalse(message.matches(".*\\b\\d{6}\\b.*"), "Log message must not reveal raw 6-digit OTP code: " + message);
        }
    }
}
