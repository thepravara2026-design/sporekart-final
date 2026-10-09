package com.sporekart.shared.infrastructure;

import com.sporekart.identity.application.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "sporekart.mail.use-real-smtp", havingValue = "true")
@RequiredArgsConstructor
public class SmtpNotificationService implements NotificationService {

    private final JavaMailSender mailSender;
    private final TwilioSmsService twilioSmsService;

    @Value("${sporekart.mail.from:${spring.mail.username:noreply@sporekart.in}}")
    private String fromEmail;

    @Override
    public void sendOtpSms(String phone, String code) {
        String messageText = "Your Sporekart verification code is: " + code + ". Valid for 5 minutes. Do not share this OTP with anyone.";
        twilioSmsService.sendSms(phone, messageText);
        log.info("Dispatched OTP SMS via Twilio to phone: {}", phone);
    }

    @Override
    public void sendOtpEmail(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Sporekart - Your Verification Code");
            message.setText("Hello,\n\nYour Sporekart verification OTP code is: " + code + "\n\nThis code will expire in 5 minutes.\nIf you did not request this code, please ignore this email.\n\nBest regards,\nSporekart Team");
            mailSender.send(message);
            log.info("Successfully dispatched OTP email via SMTP ({}) to: {}", fromEmail, email);
        } catch (Exception e) {
            log.error("Failed to send OTP email via SMTP to {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email via SMTP: " + e.getMessage(), e);
        }
    }
}
