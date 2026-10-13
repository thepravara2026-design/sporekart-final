package com.sporekart.shared.infrastructure;

import com.sporekart.identity.application.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sporekart.mail.use-real-smtp", havingValue = "false", matchIfMissing = true)
public class LoggingNotificationService implements NotificationService {
    // Note: Authentication OTP has been retired. Business transactional emails
    // are handled by NotificationEventService.
}
