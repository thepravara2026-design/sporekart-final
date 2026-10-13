package com.sporekart.identity;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.application.AuthService;
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
    private AuthService authService;

    @Test
    void testNoSensitiveSecretLoggedDuringGoogleAuth() {
        Logger authLogger = (Logger) LoggerFactory.getLogger(AuthService.class);

        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        authLogger.addAppender(appender);

        AuthDtos.GoogleOAuthRequest googleReq = new AuthDtos.GoogleOAuthRequest("sub_logging_123", "logtest@example.com", "Log", "User", "Log User");
        authService.loginWithGoogle(googleReq);

        List<ILoggingEvent> logs = appender.list;
        for (ILoggingEvent event : logs) {
            String message = event.getFormattedMessage();
            assertFalse(message.contains("jwtSecret"), "Log message must not reveal JWT secrets: " + message);
        }
    }
}
