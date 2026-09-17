package com.sporekart.admin.api;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminApplicationService adminService;

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllAuditLogs()));
    }
}
