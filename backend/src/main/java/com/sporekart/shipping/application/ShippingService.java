package com.sporekart.shipping.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.order.api.dto.OrderItemResponse;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import com.sporekart.shipping.domain.ShipmentTracking;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import com.sporekart.shipping.infrastructure.ShipmentTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShippingService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentTrackingRepository trackingRepository;
    private final ShippingProvider shippingProvider;
    private final OrderService orderService;
    private final com.sporekart.notification.application.NotificationEventService notificationEventService;
    private final com.sporekart.identity.infrastructure.UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Shipment createShipmentForOrder(UUID orderId) {
        Optional<Shipment> existing = shipmentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return existing.get();
        }

        OrderResponse order = orderService.getOrderById(orderId);
        OrderAddressSnapshot addr = order.getShippingAddress();

        List<ShippingProvider.ShipmentItemCommand> itemCommands = order.getItems().stream()
                .map(item -> ShippingProvider.ShipmentItemCommand.builder()
                        .title(item.getProductTitle())
                        .sku(item.getSku())
                        .quantity(item.getQuantity())
                        .priceInr(item.getPriceInr())
                        .build())
                .collect(Collectors.toList());

        ShippingProvider.CreateShipmentCommand command = ShippingProvider.CreateShipmentCommand.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .recipientName(addr != null ? addr.getRecipientName() : "Customer")
                .phone(addr != null ? addr.getPhone() : "")
                .addressLine1(addr != null ? addr.getLine1() : "")
                .addressLine2(addr != null ? addr.getLine2() : "")
                .city(addr != null ? addr.getCity() : "")
                .state(addr != null ? addr.getState() : "")
                .pincode(addr != null ? addr.getPincode() : "")
                .totalAmountInr(order.getTotalAmountInr())
                .items(itemCommands)
                .build();

        ShippingProvider.CreateShipmentResult result = shippingProvider.createShipment(command);

        String addrJson = "";
        try {
            addrJson = objectMapper.writeValueAsString(addr);
        } catch (Exception ignored) {}

        Shipment shipment = Shipment.builder()
                .orderId(orderId)
                .orderNumber(order.getOrderNumber())
                .providerShipmentId(result.getProviderShipmentId())
                .awbCode(result.getAwbCode())
                .courierName(result.getCourierName())
                .courierId(result.getCourierId())
                .status(ShipmentStatus.PICKUP_SCHEDULED)
                .pickupScheduledAt(ZonedDateTime.now().plusDays(1))
                .shippingAddressJson(addrJson)
                .build();

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(result.getAwbCode())
                .currentStatus("PICKUP_SCHEDULED")
                .activity(result.getMessage())
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Update Order Status to SHIPPED
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, "Shipment created: " + result.getAwbCode(), "SHIPPING_SERVICE");

        // Record Shipment Notification
        recordShipmentNotification(savedShipment, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_SHIPPED, "SHIPPED");

        return savedShipment;
    }

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentByOrderId(UUID orderId) {
        return shipmentRepository.findByOrderId(orderId);
    }

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentById(UUID shipmentId) {
        return shipmentRepository.findById(shipmentId);
    }

    @Transactional
    public ShipmentTracking updateTrackingStatus(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));

        ShippingProvider.TrackingResult trackingResult = shippingProvider.trackShipment(shipment.getAwbCode(), shipment.getProviderShipmentId());

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(trackingResult.getAwbCode())
                .currentStatus(trackingResult.getCurrentStatus())
                .location(trackingResult.getLocation())
                .activity(trackingResult.getActivity())
                .timestamp(ZonedDateTime.now())
                .eventDataJson(trackingResult.getRawResponseJson())
                .build();

        if ("DELIVERED".equalsIgnoreCase(trackingResult.getCurrentStatus())) {
            shipment.setStatus(ShipmentStatus.DELIVERED);
            shipment.setDeliveredAt(ZonedDateTime.now());
            orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED, "Order delivered", "SHIPPING_SERVICE");
            recordShipmentNotification(shipment, com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED, "DELIVERED");
        } else if ("IN_TRANSIT".equalsIgnoreCase(trackingResult.getCurrentStatus())) {
            shipment.setStatus(ShipmentStatus.IN_TRANSIT);
            recordShipmentNotification(shipment, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
        }

        shipment.addTrackingEvent(tracking);
        shipmentRepository.save(shipment);

        return tracking;
    }

    @Transactional
    public void processWebhookUpdate(String awbCode, String currentStatus, String location, String activity, String rawJson) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findByAwbCode(awbCode);
        if (shipmentOpt.isEmpty()) {
            log.warn("Received shipping webhook for unknown AWB: {}", awbCode);
            return;
        }

        Shipment shipment = shipmentOpt.get();
        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(awbCode)
                .currentStatus(currentStatus)
                .location(location)
                .activity(activity)
                .timestamp(ZonedDateTime.now())
                .eventDataJson(rawJson)
                .build();

        if ("DELIVERED".equalsIgnoreCase(currentStatus)) {
            shipment.setStatus(ShipmentStatus.DELIVERED);
            shipment.setDeliveredAt(ZonedDateTime.now());
            orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED, "Delivered via webhook", "SHIPROCKET_WEBHOOK");
            recordShipmentNotification(shipment, com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED, "DELIVERED");
        } else if ("IN_TRANSIT".equalsIgnoreCase(currentStatus)) {
            shipment.setStatus(ShipmentStatus.IN_TRANSIT);
            recordShipmentNotification(shipment, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
        }

        shipment.addTrackingEvent(tracking);
        shipmentRepository.save(shipment);
    }

    @Transactional
    public void cancelShipment(UUID shipmentId, String reason) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));

        shippingProvider.cancelShipment(shipment.getProviderShipmentId(), shipment.getAwbCode());

        shipment.setStatus(ShipmentStatus.CANCELLED);
        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(shipment.getAwbCode())
                .currentStatus("CANCELLED")
                .activity("Shipment cancelled: " + reason)
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        shipmentRepository.save(shipment);
    }

    private void recordShipmentNotification(Shipment shipment, com.sporekart.notification.domain.NotificationEventType eventType, String statusLabel) {
        try {
            OrderResponse order = orderService.getOrderById(shipment.getOrderId());
            if (order == null) return;

            String recipientEmail = null;
            String recipientPhone = null;
            String recipientName = "Valued Customer";
            if (order.getShippingAddress() != null) {
                if (order.getShippingAddress().getRecipientName() != null) {
                    recipientName = order.getShippingAddress().getRecipientName();
                }
                recipientPhone = order.getShippingAddress().getPhone();
            }

            if (order.getUserId() != null) {
                userRepository.findById(order.getUserId()).ifPresent(user -> {
                    if (user.getEmail() != null && user.getEmail().contains("@")) {
                        // Keep primary email if resolved
                    }
                    if (user.getPhone() != null && !user.getPhone().isBlank()) {
                        // Use user phone
                    }
                });

                recipientEmail = userRepository.findById(order.getUserId())
                        .map(com.sporekart.identity.domain.User::getEmail)
                        .filter(e -> e != null && e.contains("@"))
                        .orElse(null);
            }

            if ((recipientEmail == null || recipientEmail.isBlank()) && order.getShippingAddress() != null) {
                recipientEmail = order.getShippingAddress().getEmail();
            }

            notificationEventService.recordEvent(
                    eventType,
                    "SHIPMENT",
                    shipment.getId(),
                    order.getUserId(),
                    recipientEmail,
                    recipientPhone,
                    recipientName,
                    "Sporekart Shipment Update #" + order.getOrderNumber() + " 🚚",
                    java.util.Map.of(
                            "orderNumber", order.getOrderNumber(),
                            "orderId", order.getId().toString(),
                            "customerName", recipientName,
                            "courierName", shipment.getCourierName() != null ? shipment.getCourierName() : "Delhivery",
                            "awbCode", shipment.getAwbCode() != null ? shipment.getAwbCode() : "N/A",
                            "trackingUrl", (order.getTrackingUrl() != null && !order.getTrackingUrl().isBlank())
                                    ? order.getTrackingUrl()
                                    : ("https://track.shiprocket.in/" + (shipment.getAwbCode() != null ? shipment.getAwbCode() : "")),
                            "status", statusLabel
                    ),
                    eventType.name() + ":" + shipment.getId()
            );

        } catch (Exception e) {
            log.error("Failed to record shipment notification for shipment {}: {}", shipment.getId(), e.getMessage());
        }
    }
}
