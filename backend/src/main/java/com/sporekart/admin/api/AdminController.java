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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminApplicationService adminService;

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AdminAuditLog>>> getAuditLogs(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size
    ) {
        int cappedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                cappedSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllAuditLogs(pageable)));
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
