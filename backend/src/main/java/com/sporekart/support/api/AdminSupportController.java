package com.sporekart.support.api;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.support.application.SupportApplicationService;
import com.sporekart.support.domain.*;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/support")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSupportController {

    private final SupportApplicationService supportService;
    private final AdminApplicationService adminAuditService;

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getAllTickets() {
        return ResponseEntity.ok(ApiResponse.success(supportService.getAllTickets()));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<ApiResponse<SupportTicket>> getTicketById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(supportService.getTicketDetails(id)));
    }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<ApiResponse<TicketMessage>> replyToTicket(
            @PathVariable("id") UUID ticketId,
            Authentication authentication,
            @Valid @RequestBody AdminReplyRequest request
    ) {
        UUID adminId = getAdminId(authentication);
        String adminName = authentication != null ? authentication.getName() : "Support Agent";

        TicketMessage message = supportService.addMessageToTicket(
                ticketId,
                adminId,
                "SUPPORT_AGENT",
                adminName,
                request.getMessage()
        );

        adminAuditService.logAction(
                adminId,
                "REPLY_SUPPORT_TICKET",
                "SUPPORT_TICKET",
                ticketId.toString(),
                null,
                request.getMessage(),
                "Admin replied to support ticket " + ticketId,
                null
        );

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<ApiResponse<SupportTicket>> updateTicketStatus(
            @PathVariable("id") UUID ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication
    ) {
        SupportTicket updated = supportService.updateTicketStatus(ticketId, request.getStatus(), request.getPriority());

        adminAuditService.logAction(
                getAdminId(authentication),
                "UPDATE_SUPPORT_TICKET_STATUS",
                "SUPPORT_TICKET",
                ticketId.toString(),
                null,
                request.getStatus() != null ? request.getStatus().name() : null,
                "Support ticket status updated to " + request.getStatus(),
                null
        );

        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    private UUID getAdminId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
    }

    @Data
    public static class AdminReplyRequest {
        private String message;
    }

    @Data
    public static class UpdateTicketStatusRequest {
        private TicketStatus status;
        private TicketPriority priority;
    }
}
