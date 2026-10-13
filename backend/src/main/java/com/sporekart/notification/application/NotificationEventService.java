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
        return recordEvent(eventType, entityType, entityId, userId, recipientEmail, null, recipientName, subject, payload, deduplicationKey);
    }

    @Transactional
    public Optional<NotificationEvent> recordEvent(
            NotificationEventType eventType,
            String entityType,
            UUID entityId,
            UUID userId,
            String recipientEmail,
            String recipientPhone,
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

        // Auto-resolve recipient phone if not provided
        if (recipientPhone == null || recipientPhone.isBlank()) {
            if (userId != null) {
                recipientPhone = userRepository.findById(userId)
                        .map(User::getPhone)
                        .filter(p -> p != null && !p.isBlank())
                        .orElse(null);
            }
        }
        if (recipientPhone == null || recipientPhone.isBlank()) {
            if (payload != null) {
                if (payload.containsKey("phone")) recipientPhone = String.valueOf(payload.get("phone"));
                else if (payload.containsKey("customerPhone")) recipientPhone = String.valueOf(payload.get("customerPhone"));
                else if (payload.containsKey("shippingPhone")) recipientPhone = String.valueOf(payload.get("shippingPhone"));
            }
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
                .recipientEmail(recipientEmail != null ? recipientEmail.trim().toLowerCase() : null)
                .recipientPhone(recipientPhone != null ? recipientPhone.trim() : null)
                .deliveryChannel("EMAIL_AND_SMS")
                .recipientName(resolvedName)
                .templateKey(eventType.name())
                .subject(subject)
                .payloadJson(payloadJson)
                .status(NotificationStatus.PENDING)
                .smsStatus("PENDING")
                .attemptCount(0)
                .provider("GMAIL")
                .smsProvider("TWILIO")
                .deduplicationKey(deduplicationKey)
                .isRead(false)
                .category(resolveCategory(eventType, entityType))
                .actionUrl(resolveActionUrl(eventType, entityType, entityId, payload))
                .targetRole(eventType.name().startsWith("ADMIN") ? "ROLE_ADMIN" : "ROLE_CUSTOMER")
                .isAdminNotification(eventType.name().startsWith("ADMIN"))
                .build();

        NotificationEvent saved = notificationRepository.save(event);
        log.info("Recorded notification event ID {} [{}] for Email: {}, Phone: {}, isAppNotification: true", saved.getId(), eventType, recipientEmail, recipientPhone);

        // Immediate dispatch for external channels (skip email dispatch for internal admin operational events without recipient)
        if (!event.isAdminNotification() || (event.getRecipientEmail() != null && event.getRecipientEmail().contains("@"))) {
            try {
                notificationWorkerProvider.ifAvailable(worker -> worker.dispatchNotification(saved));
            } catch (Exception e) {
                log.warn("Immediate notification dispatch deferred to background worker for ID {}: {}", saved.getId(), e.getMessage());
            }
        }

        return Optional.of(saved);
    }

    private String resolveCategory(NotificationEventType eventType, String entityType) {
        if (eventType == null) return "GENERAL";
        String name = eventType.name();
        if (name.startsWith("ADMIN")) return "ADMIN";
        if (name.startsWith("ORDER")) return "ORDER";
        if (name.startsWith("SHIPMENT")) return "SHIPPING";
        if (name.startsWith("WALLET") || name.startsWith("REFUND")) return "WALLET";
        if (name.startsWith("ENROLLMENT") || name.startsWith("TRAINING")) return "TRAINING";
        if (name.startsWith("BLOG")) return "CONTENT";
        if (name.startsWith("PROMOTION")) return "PROMOTION";
        if (name.startsWith("SUPPORT")) return "SUPPORT";
        return "GENERAL";
    }

    private String resolveActionUrl(NotificationEventType eventType, String entityType, UUID entityId, Map<String, Object> payload) {
        if (payload != null && payload.containsKey("actionUrl")) {
            return String.valueOf(payload.get("actionUrl"));
        }
        if (eventType != null && eventType.name().startsWith("ADMIN")) {
            if (eventType == NotificationEventType.ADMIN_NEW_ORDER || eventType == NotificationEventType.ADMIN_ORDER_CANCELLED) {
                return "/admin/orders" + (entityId != null ? "?orderId=" + entityId : "");
            }
            if (eventType == NotificationEventType.ADMIN_WITHDRAWAL_REQUESTED) {
                return "/admin/finance";
            }
            if (eventType == NotificationEventType.ADMIN_PAYMENT_FAILURE) {
                return "/admin/orders";
            }
            if (eventType.name().contains("SUPPORT") || eventType.name().contains("TICKET")) {
                return "/admin/support" + (entityId != null ? "?ticketId=" + entityId : "");
            }
            return "/admin";
        }

        if ("ORDER".equalsIgnoreCase(entityType) || (eventType != null && eventType.name().startsWith("ORDER"))) {
            return "/dashboard?tab=activeTrack" + (entityId != null ? "&orderId=" + entityId : "");
        }
        if ("SHIPMENT".equalsIgnoreCase(entityType)) {
            return "/dashboard?tab=activeTrack" + (entityId != null ? "&orderId=" + entityId : "");
        }
        if ("WALLET".equalsIgnoreCase(entityType)) {
            return "/dashboard?tab=wallet";
        }
        if ("TRAINING".equalsIgnoreCase(entityType) || "ENROLLMENT".equalsIgnoreCase(entityType)) {
            return "/dashboard?tab=trainings" + (entityId != null ? "&bookingId=" + entityId : "");
        }
        if ("BLOG_POST".equalsIgnoreCase(entityType) || eventType == NotificationEventType.BLOG_PUBLISHED) {
            if (payload != null && payload.containsKey("slug")) {
                return "/blog/" + payload.get("slug");
            }
            return "/blog";
        }
        if ("PROMOTION".equalsIgnoreCase(entityType) || eventType == NotificationEventType.PROMOTION_PUBLISHED) {
            return "/products";
        }
        if ("SUPPORT_TICKET".equalsIgnoreCase(entityType) || (eventType != null && eventType.name().startsWith("SUPPORT"))) {
            return "/dashboard?tab=support" + (entityId != null ? "&ticketId=" + entityId : "");
        }
        return "/dashboard";
    }

    // --- In-App Query & State Mutation APIs ---

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.sporekart.notification.api.dto.NotificationDto> getUserNotifications(
            UUID userId, boolean unreadOnly, org.springframework.data.domain.Pageable pageable
    ) {
        if (userId == null) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        org.springframework.data.domain.Page<NotificationEvent> events = unreadOnly
                ? notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return events.map(com.sporekart.notification.api.dto.NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        if (userId == null) return 0;
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public com.sporekart.notification.api.dto.NotificationDto markAsRead(UUID notificationId, UUID userId) {
        NotificationEvent event = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.sporekart.shared.application.ResourceNotFoundException("Notification not found: " + notificationId));

        if (event.getUserId() != null && !event.getUserId().equals(userId)) {
            throw new com.sporekart.shared.application.ForbiddenOperationException("Access denied to notification: " + notificationId);
        }

        if (!event.isRead()) {
            event.setRead(true);
            event.setReadAt(java.time.ZonedDateTime.now());
            event = notificationRepository.save(event);
        }
        return com.sporekart.notification.api.dto.NotificationDto.fromEntity(event);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        if (userId == null) return 0;
        return notificationRepository.markAllAsReadForUser(userId, java.time.ZonedDateTime.now());
    }

    // --- Admin Operational In-App Alerts ---

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.sporekart.notification.api.dto.NotificationDto> getAdminNotifications(
            boolean unreadOnly, org.springframework.data.domain.Pageable pageable
    ) {
        org.springframework.data.domain.Page<NotificationEvent> events = unreadOnly
                ? notificationRepository.findByIsAdminNotificationTrueAndIsReadFalseOrderByCreatedAtDesc(pageable)
                : notificationRepository.findByIsAdminNotificationTrueOrderByCreatedAtDesc(pageable);
        return events.map(com.sporekart.notification.api.dto.NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getAdminUnreadCount() {
        return notificationRepository.countByIsAdminNotificationTrueAndIsReadFalse();
    }

    @Transactional
    public com.sporekart.notification.api.dto.NotificationDto markAdminAsRead(UUID notificationId) {
        NotificationEvent event = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.sporekart.shared.application.ResourceNotFoundException("Notification not found: " + notificationId));

        if (!event.isAdminNotification()) {
            throw new com.sporekart.shared.application.ForbiddenOperationException("Not an administrator notification: " + notificationId);
        }

        if (!event.isRead()) {
            event.setRead(true);
            event.setReadAt(java.time.ZonedDateTime.now());
            event = notificationRepository.save(event);
        }
        return com.sporekart.notification.api.dto.NotificationDto.fromEntity(event);
    }

    @Transactional
    public int markAdminAllAsRead() {
        return notificationRepository.markAllAsReadForAdmin(java.time.ZonedDateTime.now());
    }

    @Transactional
    public void recordAdminNotification(
            NotificationEventType eventType,
            String entityType,
            UUID entityId,
            String title,
            String message,
            String actionUrl,
            String deduplicationKey
    ) {
        try {
            if (notificationRepository.findByDeduplicationKey(deduplicationKey).isPresent()) {
                return;
            }
            NotificationEvent event = NotificationEvent.builder()
                    .eventType(eventType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .userId(null) // Operational alert applies to all administrators
                    .recipientName("Sporekart Administrator")
                    .templateKey(eventType.name())
                    .subject(title)
                    .payloadJson(objectMapper.writeValueAsString(Map.of("title", title, "message", message, "actionUrl", actionUrl)))
                    .status(NotificationStatus.SENT) // In-app only, no external email needed
                    .attemptCount(1)
                    .deduplicationKey(deduplicationKey)
                    .isRead(false)
                    .category("ADMIN")
                    .actionUrl(actionUrl)
                    .targetRole("ROLE_ADMIN")
                    .isAdminNotification(true)
                    .build();
            notificationRepository.save(event);
            log.info("Recorded admin operational notification: {}", title);
        } catch (Exception e) {
            log.error("Failed to record admin operational notification: {}", e.getMessage());
        }
    }
}


