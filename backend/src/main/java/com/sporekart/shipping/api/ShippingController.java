package com.sporekart.shipping.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentTracking;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingService shippingService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> createShipment(
            @Valid @RequestBody ShippingDtos.CreateShipmentRequest request) {

        Shipment shipment = shippingService.createShipmentForOrder(request.getOrderId());
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> getShipmentByOrder(
            @PathVariable UUID orderId) {

        Shipment shipment = shippingService.getShipmentByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found for order: " + orderId));
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
    }

    @GetMapping("/track/{shipmentId}")
    public ResponseEntity<ApiResponse<ShippingDtos.ShipmentResponse>> updateAndGetTracking(
            @PathVariable UUID shipmentId) {

        shippingService.updateTrackingStatus(shipmentId);
        Shipment shipment = shippingService.getShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(shipment)));
    }

    @PostMapping("/cancel/{shipmentId}")
    public ResponseEntity<ApiResponse<String>> cancelShipment(
            @PathVariable UUID shipmentId,
            @RequestParam(defaultValue = "Admin cancellation request") String reason) {

        shippingService.cancelShipment(shipmentId, reason);
        return ResponseEntity.ok(ApiResponse.success("Shipment cancelled successfully"));
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
