package com.sporekart.shared.infrastructure;

import com.sporekart.identity.application.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("!dev & !test")
@RequiredArgsConstructor
public class SmtpNotificationService implements NotificationService {

    private final JavaMailSender mailSender;

    @Value("${sporekart.mail.from:noreply@sporekart.in}")
    private String fromEmail;

    @Override
    public void sendOtpSms(String phone, String code) {
        // TODO: Integrate SMS provider API (e.g. Twilio/Fast2SMS) when SMS credentials are configured.
        log.info("Dispatched SMS OTP request for phone: {} [SMS provider credentials pending]", phone);
    }

    @Override
    public void sendOtpEmail(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Sporekart - Authentication OTP");
            message.setText("Your Sporekart verification OTP code is: " + code + "\nThis code will expire in 10 minutes.");
            mailSender.send(message);
            log.info("Successfully dispatched OTP email via SMTP to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP email via SMTP to {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email via SMTP", e);
        }
    }
}
