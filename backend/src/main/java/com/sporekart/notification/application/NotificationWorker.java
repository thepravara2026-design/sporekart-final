package com.sporekart.notification.application;

import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationStatus;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWorker {

    private final NotificationEventRepository notificationRepository;
    private final NotificationTemplateService templateService;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${sporekart.mail.from:${spring.mail.username:noreply@sporekart.in}}")
    private String configuredFrom;

    @Value("${sporekart.mail.from-name:Sporekart Agritech}")
    private String fromName;

    @Value("${sporekart.mail.use-real-smtp:false}")
    private boolean useRealSmtp;

    private static final int MAX_ATTEMPTS = 5;

    @Scheduled(fixedDelay = 10000)
    public void processOutboxQueue() {
        List<NotificationEvent> pendingEvents = notificationRepository
                .findTop20ByStatusInAndAttemptCountLessThanOrderByCreatedAtAsc(
                        List.of(NotificationStatus.PENDING, NotificationStatus.RETRY_SCHEDULED, NotificationStatus.FAILED),
                        MAX_ATTEMPTS + 5
                );

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Processing {} pending notification events in outbox queue (useRealSmtp={})", pendingEvents.size(), useRealSmtp);

        for (NotificationEvent event : pendingEvents) {
            dispatchNotification(event);
        }
    }

    public void dispatchNotification(NotificationEvent event) {
        event.setStatus(NotificationStatus.PROCESSING);
        event.setAttemptCount(event.getAttemptCount() + 1);
        event.setLastAttemptAt(ZonedDateTime.now());
        notificationRepository.save(event);

        try {
            String htmlBody = templateService.buildHtmlEmail(event.getEventType(), event.getPayloadJson());

            String activeFrom = (configuredFrom != null && !configuredFrom.isBlank() && configuredFrom.contains("@"))
                    ? configuredFrom
                    : ((smtpUsername != null && !smtpUsername.isBlank() && smtpUsername.contains("@")) ? smtpUsername : "noreply@sporekart.in");

            // Attempt real email dispatch via JavaMailSender (same credentials as OTP)
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                try {
                    helper.setFrom(activeFrom, fromName != null && !fromName.isBlank() ? fromName : "Sporekart Agritech");
                } catch (Exception e) {
                    helper.setFrom(activeFrom);
                }

                helper.setTo(event.getRecipientEmail());
                helper.setSubject(event.getSubject());
                helper.setText(htmlBody, true);

                mailSender.send(message);

                event.setStatus(NotificationStatus.SENT);
                event.setSentAt(ZonedDateTime.now());
                event.setErrorMessage(null);
                notificationRepository.save(event);

                log.info("Successfully dispatched email notification ID {} [{}] via JavaMailSender to {}", event.getId(), event.getEventType(), event.getRecipientEmail());
                return;
            } catch (Exception e) {
                if (useRealSmtp) {
                    log.error("Failed to send real SMTP email notification ID {} [{}] to {}: {}", event.getId(), event.getEventType(), event.getRecipientEmail(), e.getMessage());
                    throw e; // Rethrow to trigger retry policy for real SMTP mode
                } else {
                    log.warn("Real SMTP dispatch failed for event ID {} [{}] to {} ({}), falling back to log mode: {}", 
                            event.getId(), event.getEventType(), event.getRecipientEmail(), activeFrom, e.getMessage());
                }
            }

            // Log mode fallback when USE_REAL_SMTP is false and local dev mail server is unreachable
            log.info("[NOTIFICATION DISPATCHED - LOG MODE] Event ID: {}, Type: {}, Recipient: {}, Subject: {}\nHTML Content Size: {} bytes",
                    event.getId(), event.getEventType(), event.getRecipientEmail(), event.getSubject(), htmlBody.length());

            event.setStatus(NotificationStatus.SENT);
            event.setSentAt(ZonedDateTime.now());
            event.setErrorMessage(null);
            notificationRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to process notification ID {} [{}] to {}: {}", event.getId(), event.getEventType(), event.getRecipientEmail(), e.getMessage());
            
            event.setFailedAt(ZonedDateTime.now());
            event.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Unknown email dispatch error");

            if (event.getAttemptCount() >= MAX_ATTEMPTS) {
                event.setStatus(NotificationStatus.FAILED);
            } else {
                event.setStatus(NotificationStatus.RETRY_SCHEDULED);
            }
            notificationRepository.save(event);
        }
    }
}
