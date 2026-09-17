package com.sporekart.order.api;

import com.sporekart.order.api.dto.*;
import com.sporekart.order.application.OrderService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request) {
        UUID userId = extractUserId(authentication);
        OrderResponse response = orderService.createOrderFromCart(userId, sessionId, idempotencyKey, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated user"));
        }
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetails(
            Authentication authentication,
            @PathVariable("id") UUID orderId) {
        UUID userId = extractUserId(authentication);
        OrderResponse response = orderService.getOrderDetails(orderId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @PathVariable("id") UUID orderId,
            @RequestParam(value = "reason", required = false, defaultValue = "Cancelled by customer") String reason) {
        UUID userId = extractUserId(authentication);
        OrderResponse response = orderService.cancelOrder(orderId, userId, reason);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            Authentication authentication,
            @PathVariable("id") UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        String adminName = authentication != null ? authentication.getName() : "ADMIN";
        OrderResponse response = orderService.updateOrderStatus(orderId, request.getNewStatus(), request.getReason(), "ADMIN:" + adminName);
        return ResponseEntity.ok(ApiResponse.success(response));
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
