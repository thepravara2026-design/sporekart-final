package com.sporekart.support.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.support.application.SupportApplicationService;
import com.sporekart.support.domain.*;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportApplicationService supportService;

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<SupportTicket>> createTicket(
            Authentication authentication,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        UUID userId = getUserId(authentication);
        String senderName = authentication != null ? authentication.getName() : "Customer";

        SupportTicket ticket = supportService.createTicket(
                userId,
                request.getSubject(),
                request.getCategory(),
                request.getPriority(),
                request.getMessage(),
                senderName,
                request.getOrderId(),
                request.getPaymentId(),
                request.getShipmentId(),
                request.getCourseId(),
                request.getProductId()
        );
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getMyTickets(Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(supportService.getUserTickets(userId)));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<ApiResponse<SupportTicket>> getTicketById(
            Authentication authentication,
            @PathVariable("id") UUID id) {
        UUID userId = getUserId(authentication);
        SupportTicket ticket = supportService.getTicketDetails(id);

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (userId == null || (ticket.getUserId() != null && !ticket.getUserId().equals(userId) && !isAdmin)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "Access denied: You do not own this support ticket"));
        }

        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<ApiResponse<TicketMessage>> addMessage(
            @PathVariable("id") UUID ticketId,
            Authentication authentication,
            @Valid @RequestBody AddMessageRequest request
    ) {
        UUID senderId = getUserId(authentication);
        SupportTicket ticket = supportService.getTicketDetails(ticketId);

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (senderId == null || (ticket.getUserId() != null && !ticket.getUserId().equals(senderId) && !isAdmin)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "Access denied: You cannot message on this ticket"));
        }

        String senderName = authentication != null ? authentication.getName() : "Customer";

        TicketMessage msg = supportService.addMessageToTicket(
                ticketId,
                senderId,
                "CUSTOMER",
                senderName,
                request.getMessage()
        );
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    private UUID getUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (Exception e) {
            return null;
        }
    }

    @Data
    public static class CreateTicketRequest {
        private String subject;
        private TicketCategory category;
        private TicketPriority priority;
        private String message;
        private UUID orderId;
        private UUID paymentId;
        private UUID shipmentId;
        private UUID courseId;
        private UUID productId;
    }

    @Data
    public static class AddMessageRequest {
        private String message;
    }
}
