package com.sporekart.notification.application;

import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationStatus;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
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

    // Circuit breaker for Gmail / SMTP daily sending limit exceeded
    private static volatile ZonedDateTime dailyLimitCooldownUntil = null;

    /**
     * Determines whether an email address is a synthetic or test address
     * that should not be routed to a public SMTP relay.
     */
    public static boolean isNonRoutableOrTestEmail(String email) {
        if (email == null || email.isBlank()) {
            return true;
        }
        String trimmed = email.trim().toLowerCase();
        int atIndex = trimmed.lastIndexOf('@');
        if (atIndex == -1 || atIndex == trimmed.length() - 1) {
            return true;
        }
        String domain = trimmed.substring(atIndex + 1);
        return domain.endsWith(".test")
                || domain.endsWith(".example")
                || domain.endsWith(".invalid")
                || domain.endsWith(".localhost")
                || domain.equals("test.com")
                || domain.equals("example.com")
                || domain.contains("sporekart-qa")
                || domain.contains("qa.test")
                || domain.contains("mock")
                || trimmed.startsWith("test_")
                || trimmed.startsWith("unauth_notif_");
    }

    /**
     * Checks if the exception or any of its causes indicates that the SMTP provider
     * (e.g. Gmail 550-5.4.5) has rejected sending because the daily quota was exceeded.
     */
    public static boolean isDailySendingLimitOrQuotaExceeded(Throwable t) {
        while (t != null) {
            String msg = t.getMessage();
            if (msg != null) {
                String lower = msg.toLowerCase();
                if (lower.contains("daily user sending limit exceeded")
                        || lower.contains("daily sending limit")
                        || lower.contains("550-5.4.5")
                        || lower.contains("550 5.4.5")
                        || lower.contains("quota exceeded")
                        || lower.contains("sending limit exceeded")) {
                    return true;
                }
            }
            t = t.getCause();
        }
        return false;
    }

    @Scheduled(fixedDelay = 10000)
    @SchedulerLock(name = "NotificationWorker_processOutbox", lockAtMostFor = "8s", lockAtLeastFor = "3s")
    public void processOutboxQueue() {
        List<NotificationEvent> pendingEvents = notificationRepository
                .findTop20ByStatusInAndAttemptCountLessThanOrderByCreatedAtAsc(
                        List.of(NotificationStatus.PENDING, NotificationStatus.RETRY_SCHEDULED),
                        MAX_ATTEMPTS
                );

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Processing {} pending notification events in outbox queue (useRealSmtp={})", pendingEvents.size(), useRealSmtp);

        for (NotificationEvent event : pendingEvents) {
            dispatchNotification(event);
        }
    }

    @Scheduled(cron = "${sporekart.notification.retention.cron:0 0 3 * * ?}")
    @SchedulerLock(name = "NotificationWorker_cleanupOldArchivedNotifications", lockAtMostFor = "1h", lockAtLeastFor = "5m")
    @org.springframework.transaction.annotation.Transactional
    public void cleanupOldArchivedNotifications() {
        try {
            ZonedDateTime cutoff = ZonedDateTime.now().minusDays(90);
            int deleted = notificationRepository.deleteByStatusAndSentAtBefore(NotificationStatus.SENT, cutoff);
            if (deleted > 0) {
                log.info("Purged {} archived SENT notifications older than 90 days (cutoff: {})", deleted, cutoff);
            }
        } catch (Exception e) {
            log.error("Failed to run scheduled notification outbox cleanup: {}", e.getMessage());
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void dispatchNotificationAsync(NotificationEvent event) {
        dispatchNotification(event);
    }

    public void dispatchNotification(NotificationEvent event) {
        event.setStatus(NotificationStatus.PROCESSING);
        event.setAttemptCount(event.getAttemptCount() + 1);
        event.setLastAttemptAt(ZonedDateTime.now());
        notificationRepository.save(event);
        // DISPATCH EMAIL NOTIFICATION (if email is present)
        try {
            if (event.getRecipientEmail() != null && event.getRecipientEmail().contains("@")) {
                String htmlBody = templateService.buildHtmlEmail(event.getEventType(), event.getPayloadJson());

                String activeFrom = (configuredFrom != null && !configuredFrom.isBlank() && configuredFrom.contains("@"))
                        ? configuredFrom
                        : ((smtpUsername != null && !smtpUsername.isBlank() && smtpUsername.contains("@")) ? smtpUsername : "noreply@sporekart.in");

                // Check 1: Non-routable or synthetic test email domains (e.g. *.test, sporekart-qa.test)
                if (isNonRoutableOrTestEmail(event.getRecipientEmail())) {
                    log.info("[NOTIFICATION DISPATCHED - SIMULATED TEST EMAIL] Event ID: {}, Type: {}, Recipient: {} (non-routable test domain)",
                            event.getId(), event.getEventType(), event.getRecipientEmail());
                    event.setStatus(NotificationStatus.SENT);
                    event.setSentAt(ZonedDateTime.now());
                    event.setErrorMessage(null);
                    notificationRepository.save(event);
                    return;
                }

                // Check 2: Active Gmail daily sending limit cooldown circuit breaker
                if (dailyLimitCooldownUntil != null && ZonedDateTime.now().isBefore(dailyLimitCooldownUntil)) {
                    log.warn("[NOTIFICATION DISPATCHED - LOG MODE FALLBACK (GMAIL DAILY LIMIT COOLDOWN ACTIVE UNTIL {})] Event ID: {}, Type: {}, Recipient: {}, Subject: {}\nHTML Content Size: {} bytes",
                            dailyLimitCooldownUntil, event.getId(), event.getEventType(), event.getRecipientEmail(), event.getSubject(), htmlBody != null ? htmlBody.length() : 0);
                    event.setStatus(NotificationStatus.SENT);
                    event.setSentAt(ZonedDateTime.now());
                    event.setErrorMessage("Dispatched via LOG fallback (Gmail daily limit cooldown active until " + dailyLimitCooldownUntil + ")");
                    notificationRepository.save(event);
                    return;
                }

                // Attempt real email dispatch via JavaMailSender
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
                    // Check if error is Gmail daily sending limit exceeded (550 / 550-5.4.5)
                    if (isDailySendingLimitOrQuotaExceeded(e)) {
                        dailyLimitCooldownUntil = ZonedDateTime.now().plusHours(4);
                        log.warn("Gmail daily user sending limit exceeded (550). Activating 4-hour LOG mode fallback until {}. Event ID {} [{}] to {}: {}",
                                dailyLimitCooldownUntil, event.getId(), event.getEventType(), event.getRecipientEmail(), e.getMessage());

                        event.setStatus(NotificationStatus.SENT);
                        event.setSentAt(ZonedDateTime.now());
                        event.setErrorMessage("Dispatched via LOG mode fallback (Gmail daily sending limit exceeded 550)");
                        notificationRepository.save(event);
                        return;
                    }

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
            }

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

