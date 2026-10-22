package com.sporekart.notification.api;

import com.sporekart.notification.api.dto.NotificationDto;
import com.sporekart.notification.application.NotificationEventService;
import com.sporekart.notification.application.NotificationWorker;
import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.notification.domain.NotificationStatus;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/admin/notifications", "/api/v1/admin/notifications"})
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationEventRepository notificationRepository;
    private final NotificationWorker notificationWorker;
    private final NotificationEventService notificationEventService;

    // Outbox Email / SMS Operations
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationEvent>>> getAllNotifications(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        NotificationEventType typeEnum = null;
        if (eventType != null && !eventType.isBlank() && !"ALL".equalsIgnoreCase(eventType)) {
            try {
                typeEnum = NotificationEventType.valueOf(eventType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid notification eventType: '" + eventType + "'. Allowed values: " + java.util.Arrays.toString(NotificationEventType.values()));
            }
        }

        NotificationStatus statusEnum = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try {
                statusEnum = NotificationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid notification status: '" + status + "'. Allowed values: " + java.util.Arrays.toString(NotificationStatus.values()));
            }
        }

        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        org.springframework.data.domain.Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationEvent> result = (typeEnum == null && statusEnum == null && trimmedSearch == null)
                ? notificationRepository.findAll(pageable)
                : notificationRepository.findAllFiltered(typeEnum, statusEnum, trimmedSearch, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<ApiResponse<NotificationEvent>> retryNotification(@PathVariable UUID id) {
        NotificationEvent event = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification event not found: " + id));

        event.setStatus(NotificationStatus.PENDING);
        event.setAttemptCount(0);
        event.setErrorMessage(null);
        NotificationEvent saved = notificationRepository.save(event);

        // Immediate retry dispatch
        notificationWorker.dispatchNotification(saved);

        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    // In-App Operational Alert Operations
    @GetMapping("/in-app")
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getAdminInAppNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int clampedSize = Math.min(Math.max(size, 1), 50);
        Page<NotificationDto> result = notificationEventService.getAdminNotifications(
                unreadOnly, PageRequest.of(page, clampedSize)
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping({"/in-app/unread-count", "/unread-count"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminUnreadCount() {
        long count = notificationEventService.getAdminUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @RequestMapping(value = "/in-app/{id}/read", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<NotificationDto>> markAdminAsRead(@PathVariable UUID id) {
        NotificationDto dto = notificationEventService.markAdminAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @RequestMapping(value = "/in-app/read-all", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAdminAllAsRead() {
        int count = notificationEventService.markAdminAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(Map.of("markedCount", count)));
    }
}
