package com.sporekart.notification.api;

import com.sporekart.notification.api.dto.NotificationDto;
import com.sporekart.notification.application.NotificationEventService;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ForbiddenOperationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
public class CustomerNotificationController {

    private final NotificationEventService notificationEventService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getCustomerNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }
        int clampedSize = Math.min(Math.max(size, 1), 50);
        Page<NotificationDto> result = notificationEventService.getUserNotifications(
                userId, unreadOnly, PageRequest.of(page, clampedSize)
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }
        long count = notificationEventService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }
        NotificationDto dto = notificationEventService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @RequestMapping(value = "/read-all", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }
        int updated = notificationEventService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("markedCount", updated)));
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
