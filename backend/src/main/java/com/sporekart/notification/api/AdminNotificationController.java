package com.sporekart.notification.api;

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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationEventRepository notificationRepository;
    private final NotificationWorker notificationWorker;

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
            try { typeEnum = NotificationEventType.valueOf(eventType.toUpperCase()); } catch (Exception ignored) {}
        }

        NotificationStatus statusEnum = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try { statusEnum = NotificationStatus.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }

        Page<NotificationEvent> result = notificationRepository.findAllFiltered(
                typeEnum, statusEnum, search, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
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
}
