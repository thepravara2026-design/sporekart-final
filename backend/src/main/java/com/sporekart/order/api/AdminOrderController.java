package com.sporekart.order.api;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AdminApplicationService adminAuditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "25") int size
    ) {
        int cappedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                cappedSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOrders(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable("id") UUID id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            Authentication authentication
    ) {
        Order existing = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));

        String oldStatus = existing.getStatus().name();
        OrderResponse updated = orderService.updateOrderStatus(id, request.getStatus(), request.getReason(), "ADMIN");

        adminAuditService.logAction(
                getAdminId(authentication),
                "UPDATE_ORDER_STATUS",
                "ORDER",
                id.toString(),
                oldStatus,
                request.getStatus().name(),
                "Order " + existing.getOrderNumber() + " status updated to " + request.getStatus(),
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
    public static class UpdateOrderStatusRequest {
        private OrderStatus status;
        private String reason;
    }
}
