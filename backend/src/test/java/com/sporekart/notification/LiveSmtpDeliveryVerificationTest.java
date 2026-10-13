package com.sporekart.notification;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class LiveSmtpDeliveryVerificationTest {

    @Test
    @DisplayName("SMTP-LIVE-01: Verify JavaMailSender connects and dispatches live email through Gmail SMTP")
    void testLiveGmailSmtpDispatch() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername("praveenkodekal8@gmail.com");
        mailSender.setPassword("fsyzluudsorgigym");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");

        assertDoesNotThrow(() -> {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("praveenkodekal8@gmail.com", "Sporekart Notification Verification");
            helper.setTo("praveenkodekal8@gmail.com");
            helper.setSubject("Sporekart System Update: Notifications Active & Verified 🍄");
            helper.setText("<h3>Sporekart Notification Verification</h3><p>Your Gmail SMTP notification pipeline is active and verified.</p>", true);

            mailSender.send(message);
            System.out.println("✓ LIVE SMTP DISPATCH SUCCESS: Email transmitted successfully via smtp.gmail.com:587 to praveenkodekal8@gmail.com");
        });
    }
}
