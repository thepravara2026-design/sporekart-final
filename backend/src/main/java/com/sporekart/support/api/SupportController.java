package com.sporekart.support.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.support.application.SupportApplicationService;
import com.sporekart.support.domain.SupportTicket;
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
            @RequestParam String subject,
            @RequestParam String message) {
        UUID userId = authentication != null ? UUID.fromString(authentication.getName()) : null;
        SupportTicket ticket = supportService.createTicket(userId, subject, message);
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getMyTickets(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(supportService.getUserTickets(userId)));
    }
}
