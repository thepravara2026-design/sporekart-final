package com.sporekart.admin.api;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.training.infrastructure.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminApplicationService adminService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

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
        long totalProducts = productRepository.count();
        long activeOrders = orderRepository.countActiveOrders();
        long totalCustomers = userRepository.count();
        long activeCourses = courseRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenueInr();

        AdminAnalyticsOverview overview = AdminAnalyticsOverview.builder()
                .totalProducts(totalProducts)
                .activeOrders(activeOrders)
                .totalCustomers(totalCustomers)
                .activeCourses(activeCourses)
                .totalRevenueInr(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
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
        private BigDecimal totalRevenueInr;
        private String systemHealthStatus;
    }
}
