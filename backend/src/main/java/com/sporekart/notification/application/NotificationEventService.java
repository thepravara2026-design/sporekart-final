package com.sporekart.notification.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.notification.domain.NotificationStatus;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEventService {

    private final NotificationEventRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${sporekart.mail.fallback-recipient:${spring.mail.username:praveenkodekal8@gmail.com}}")
    private String defaultFallbackEmail;

    private final org.springframework.beans.factory.ObjectProvider<NotificationWorker> notificationWorkerProvider;

    @Transactional
    public Optional<NotificationEvent> recordEvent(
            NotificationEventType eventType,
            String entityType,
            UUID entityId,
            UUID userId,
            String recipientEmail,
            String recipientName,
            String subject,
            Map<String, Object> payload,
            String deduplicationKey
    ) {
        if (recipientEmail == null || recipientEmail.isBlank() || !recipientEmail.contains("@")) {
            if (userId != null) {
                recipientEmail = userRepository.findById(userId)
                        .map(User::getEmail)
                        .filter(e -> e != null && e.contains("@"))
                        .orElse(null);
            }
        }

        if (recipientEmail == null || recipientEmail.isBlank() || !recipientEmail.contains("@")) {
            recipientEmail = (defaultFallbackEmail != null && defaultFallbackEmail.contains("@")) ? defaultFallbackEmail : "praveenkodekal8@gmail.com";
            log.info("Using fallback recipient email ({}) for notification event {} (User ID: {})", recipientEmail, eventType, userId);
        }

        // Idempotency check
        Optional<NotificationEvent> existing = notificationRepository.findByDeduplicationKey(deduplicationKey);
        if (existing.isPresent()) {
            log.info("Notification event for key {} already exists (idempotent ignore)", deduplicationKey);
            return existing;
        }

        String payloadJson = "{}";
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize notification payload for {}: {}", deduplicationKey, e.getMessage());
        }

        String resolvedName = recipientName;
        if ((resolvedName == null || resolvedName.isBlank()) && userId != null) {
            resolvedName = userRepository.findById(userId)
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getFirstName())
                    .orElse("Valued Customer");
        }

        NotificationEvent event = NotificationEvent.builder()
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .userId(userId)
                .recipientEmail(recipientEmail.trim().toLowerCase())
                .recipientName(resolvedName)
                .templateKey(eventType.name())
                .subject(subject)
                .payloadJson(payloadJson)
                .status(NotificationStatus.PENDING)
                .attemptCount(0)
                .provider("GMAIL")
                .deduplicationKey(deduplicationKey)
                .build();

        NotificationEvent saved = notificationRepository.save(event);
        log.info("Recorded notification event ID {} [{}] for {}", saved.getId(), eventType, recipientEmail);

        // Immediate dispatch
        try {
            notificationWorkerProvider.ifAvailable(worker -> worker.dispatchNotification(saved));
        } catch (Exception e) {
            log.warn("Immediate notification dispatch deferred to background worker for ID {}: {}", saved.getId(), e.getMessage());
        }

        return Optional.of(saved);
    }
}
