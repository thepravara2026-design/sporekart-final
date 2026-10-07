package com.sporekart.notification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_events", indexes = {
        @Index(name = "idx_notification_events_status", columnList = "status, created_at"),
        @Index(name = "idx_notification_events_user", columnList = "user_id"),
        @Index(name = "idx_notification_events_dedup", columnList = "deduplication_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private NotificationEventType eventType;

    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "template_key", nullable = false, length = 64)
    private String templateKey;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "payload_json", nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "last_attempt_at")
    private ZonedDateTime lastAttemptAt;

    @Column(name = "sent_at")
    private ZonedDateTime sentAt;

    @Column(name = "failed_at")
    private ZonedDateTime failedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "provider", length = 32)
    @Builder.Default
    private String provider = "GMAIL";

    @Column(name = "provider_message_id")
    private String providerMessageId;

    @Column(name = "deduplication_key", nullable = false, unique = true)
    private String deduplicationKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }
}
