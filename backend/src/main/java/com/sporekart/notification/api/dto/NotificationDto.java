package com.sporekart.notification.api.dto;

import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private static final com.fasterxml.jackson.databind.ObjectMapper OBJECT_MAPPER = new com.fasterxml.jackson.databind.ObjectMapper();

    private UUID id;
    private NotificationEventType eventType;
    private String entityType;
    private UUID entityId;
    private String category;
    private String title;
    private String message;
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead;
    private ZonedDateTime readAt;
    private String actionUrl;
    private ZonedDateTime createdAt;

    public static NotificationDto fromEntity(NotificationEvent entity) {
        if (entity == null) return null;
        String message = entity.getSubject();
        if (entity.getPayloadJson() != null && !entity.getPayloadJson().isBlank()) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = OBJECT_MAPPER.readTree(entity.getPayloadJson());
                if (node.hasNonNull("message")) {
                    message = node.get("message").asText();
                } else if (node.hasNonNull("reason")) {
                    message = "Reason: " + node.get("reason").asText();
                }
            } catch (Exception ignored) {}
        }
        return NotificationDto.builder()
                .id(entity.getId())
                .eventType(entity.getEventType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .category(entity.getCategory() != null ? entity.getCategory() : "GENERAL")
                .title(entity.getSubject())
                .message(message)
                .isRead(entity.isRead())
                .readAt(entity.getReadAt())
                .actionUrl(entity.getActionUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
