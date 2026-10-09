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

    private final TwilioSmsService twilioSmsService;

    @Override
    public void sendOtpSms(String phone, String code) {
        String messageText = "Your Sporekart verification code is: " + code + ". Valid for 5 minutes. Do not share this OTP with anyone.";
        twilioSmsService.sendSms(phone, messageText);
        log.info("Dispatched OTP SMS via Twilio to phone: {}", phone);
    }

    @Override
    public void sendOtpEmail(String email, String code) {
        log.info("Dispatched OTP Email to email: {} [server-side notification]", email);
    }
}

