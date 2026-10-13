package com.sporekart.shipping.api;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shipping.application.ShippingApplicationService;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentTracking;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingService shippingService;
    private final ShippingApplicationService shippingApplicationService;
    private final OrderService orderService;

    @GetMapping("/check-pincode/{pincode}")
    public ResponseEntity<ApiResponse<ShippingDtos.PincodeServiceabilityResponse>> checkPincode(
            @PathVariable String pincode) {
        return ResponseEntity.ok(ApiResponse.success(shippingApplicationService.checkPincodeServiceability(pincode)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> createShipment(
            @Valid @RequestBody ShippingDtos.CreateShipmentRequest request) {

        Shipment shipment = shippingService.createShipmentForOrder(request.getOrderId());
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> getShipmentByOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {

        Shipment shipment = shippingService.getShipmentByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found for order: " + orderId));

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdmin) {
            OrderResponse order = orderService.getOrderById(orderId);
            UUID currentUserId = extractUserId(authentication);
            if (order.getUserId() != null && (currentUserId == null || !order.getUserId().equals(currentUserId))) {
                throw new AccessDeniedException("You do not have permission to view shipment details for this order");
            }
        }

        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
    }

    @GetMapping("/track/{shipmentId}")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> updateAndGetTracking(
            @PathVariable UUID shipmentId,
            Authentication authentication) {

        Shipment shipment = shippingService.getShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdmin) {
            OrderResponse order = orderService.getOrderById(shipment.getOrderId());
            UUID currentUserId = extractUserId(authentication);
            if (order.getUserId() != null && (currentUserId == null || !order.getUserId().equals(currentUserId))) {
                throw new AccessDeniedException("You do not have permission to track this shipment");
            }
        }

        shippingService.updateTrackingStatus(shipmentId);
        Shipment updated = shippingService.getShipmentById(shipmentId).orElse(shipment);
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(updated)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/cancel/{shipmentId}")
    public ResponseEntity<ApiResponse<String>> cancelShipment(
            @PathVariable UUID shipmentId,
            @RequestParam(defaultValue = "Admin cancellation request") String reason) {

        shippingService.cancelShipment(shipmentId, reason);
        return ResponseEntity.ok(ApiResponse.success("Shipment cancelled successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/simulate-event/{shipmentId}")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> simulateCourierEvent(
            @PathVariable UUID shipmentId,
            @Valid @RequestBody ShippingDtos.SimulateCourierEventRequest request) {

        Shipment shipment = shippingService.simulateCourierEvent(
                shipmentId,
                request.getStatus(),
                request.getLocation(),
                request.getActivity()
        );
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
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

    private ShippingDtos.ShipmentResponse mapToResponse(Shipment shipment) {
        return ShippingDtos.ShipmentResponse.builder()
                .id(shipment.getId())
                .orderId(shipment.getOrderId())
                .orderNumber(shipment.getOrderNumber())
                .providerShipmentId(shipment.getProviderShipmentId())
                .awbCode(shipment.getAwbCode())
                .courierName(shipment.getCourierName())
                .courierId(shipment.getCourierId())
                .status(shipment.getStatus())
                .pickupScheduledAt(shipment.getPickupScheduledAt())
                .deliveredAt(shipment.getDeliveredAt())
                .trackingEvents(shipment.getTrackingEvents().stream().map(this::mapTrackingEvent).collect(Collectors.toList()))
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }

    private ShippingDtos.TrackingEventResponse mapTrackingEvent(ShipmentTracking tracking) {
        return ShippingDtos.TrackingEventResponse.builder()
                .id(tracking.getId())
                .awbCode(tracking.getAwbCode())
                .currentStatus(tracking.getCurrentStatus())
                .location(tracking.getLocation())
                .activity(tracking.getActivity())
                .timestamp(tracking.getTimestamp())
                .build();
    }
}

