package com.sporekart.notification.api;

import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ForbiddenOperationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class CustomerNotificationController {

    private final NotificationEventRepository notificationRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<NotificationEvent>>> getCustomerNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }
        Page<NotificationEvent> result = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size)
        );
        return ResponseEntity.ok(ApiResponse.success(result));
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
