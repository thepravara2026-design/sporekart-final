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

    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<AdminAnalyticsOverview>> getAnalyticsOverview() {
        AdminAnalyticsOverview overview = AdminAnalyticsOverview.builder()
                .totalProducts(18)
                .activeOrders(5)
                .totalCustomers(42)
                .activeCourses(4)
                .totalRevenueInr(new java.math.BigDecimal("128500.00"))
                .systemHealthStatus("HEALTHY")
                .build();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AdminAnalyticsOverview {
        private long totalProducts;
        private long activeOrders;
        private long totalCustomers;
        private long activeCourses;
        private java.math.BigDecimal totalRevenueInr;
        private String systemHealthStatus;
    }
}
