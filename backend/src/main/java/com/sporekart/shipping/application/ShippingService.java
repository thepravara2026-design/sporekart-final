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

import java.math.BigDecimal;
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
    @org.springframework.context.annotation.Lazy
    private final OrderService orderService;
    private final com.sporekart.notification.application.NotificationEventService notificationEventService;
    private final com.sporekart.identity.infrastructure.UserRepository userRepository;
    private final com.sporekart.catalog.infrastructure.ProductVariantRepository variantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.pickup-location:Primary}")
    private String pickupLocation;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.pickup-pincode:411001}")
    private String pickupPincode;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.tracking-base-url:https://track.shiprocket.in/}")
    private String trackingBaseUrl;

    @Transactional
    public Shipment createShipmentForOrder(UUID orderId) {
        Optional<Shipment> existing = shipmentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return existing.get();
        }

        OrderResponse order = orderService.getOrderById(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Cannot create courier shipment for a cancelled or refunded order (Order #" + order.getOrderNumber() + ")");
        }
        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Cannot create courier shipment for order #" + order.getOrderNumber() + " with status " + order.getStatus() + ". Order must be PAID or CONFIRMED.");
        }

        OrderAddressSnapshot addr = order.getShippingAddress();

        BigDecimal totalWeightKg = BigDecimal.ZERO;
        BigDecimal maxLengthCm = BigDecimal.ZERO;
        BigDecimal maxBreadthCm = BigDecimal.ZERO;
        BigDecimal totalHeightCm = BigDecimal.ZERO;

        List<ShippingProvider.ShipmentItemCommand> itemCommands = new java.util.ArrayList<>();
        if (order.getItems() != null) {
            for (var item : order.getItems()) {
                BigDecimal itemWeight = new BigDecimal("0.250");
                BigDecimal itemLength = new BigDecimal("15.00");
                BigDecimal itemBreadth = new BigDecimal("15.00");
                BigDecimal itemHeight = new BigDecimal("10.00");

                if (item.getVariantId() != null && variantRepository != null) {
                    var variantOpt = variantRepository.findById(item.getVariantId());
                    if (variantOpt.isPresent()) {
                        var v = variantOpt.get();
                        if (v.getWeightKg() != null && v.getWeightKg().compareTo(BigDecimal.ZERO) > 0) {
                            itemWeight = v.getWeightKg();
                        }
                        if (v.getLengthCm() != null && v.getLengthCm().compareTo(BigDecimal.ZERO) > 0) {
                            itemLength = v.getLengthCm();
                        }
                        if (v.getBreadthCm() != null && v.getBreadthCm().compareTo(BigDecimal.ZERO) > 0) {
                            itemBreadth = v.getBreadthCm();
                        }
                        if (v.getHeightCm() != null && v.getHeightCm().compareTo(BigDecimal.ZERO) > 0) {
                            itemHeight = v.getHeightCm();
                        }
                    }
                }

                int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                totalWeightKg = totalWeightKg.add(itemWeight.multiply(BigDecimal.valueOf(qty)));
                if (itemLength.compareTo(maxLengthCm) > 0) maxLengthCm = itemLength;
                if (itemBreadth.compareTo(maxBreadthCm) > 0) maxBreadthCm = itemBreadth;
                totalHeightCm = totalHeightCm.add(itemHeight.multiply(BigDecimal.valueOf(qty)));

                itemCommands.add(ShippingProvider.ShipmentItemCommand.builder()
                        .title(item.getProductTitle())
                        .sku(item.getSku())
                        .quantity(qty)
                        .priceInr(item.getPriceInr())
                        .weightKg(itemWeight)
                        .build());
            }
        }

        if (totalWeightKg.compareTo(new BigDecimal("0.100")) < 0) {
            totalWeightKg = new BigDecimal("0.250");
        }
        if (maxLengthCm.compareTo(BigDecimal.ZERO) <= 0) {
            maxLengthCm = new BigDecimal("15.00");
        }
        if (maxBreadthCm.compareTo(BigDecimal.ZERO) <= 0) {
            maxBreadthCm = new BigDecimal("15.00");
        }
        if (totalHeightCm.compareTo(BigDecimal.ZERO) <= 0) {
            totalHeightCm = new BigDecimal("10.00");
        }

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
                .weightKg(totalWeightKg)
                .lengthCm(maxLengthCm)
                .breadthCm(maxBreadthCm)
                .heightCm(totalHeightCm)
                .pickupLocation(pickupLocation != null && !pickupLocation.isBlank() ? pickupLocation : "Primary")
                .pickupPincode(pickupPincode != null && !pickupPincode.isBlank() ? pickupPincode : "411001")
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
                .courierName(result.getCourierName() != null ? result.getCourierName() : "BlueDart Express")
                .courierId(result.getCourierId() != null ? result.getCourierId() : "BLUEDART_1")
                .status(ShipmentStatus.PICKUP_SCHEDULED)
                .pickupScheduledAt(ZonedDateTime.now().plusDays(1))
                .shippingAddressJson(addrJson)
                .build();

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(result.getAwbCode())
                .currentStatus("PICKUP_SCHEDULED")
                .activity(result.getMessage() != null ? result.getMessage() : "Shipment created and pickup scheduled with courier partner")
                .location("Warehouse Manifest Facility")
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Update Order Shipping Details and set Order Status to SHIPPED
        orderService.updateOrderShippingDetails(
                orderId,
                savedShipment.getCourierName(),
                savedShipment.getAwbCode(),
                buildTrackingUrl(savedShipment.getAwbCode())
        );
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, "Shipment created: " + result.getAwbCode(), "SHIPPING_SERVICE");

        // Record Shipment Notification
        recordShipmentNotification(savedShipment, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_SHIPPED, "SHIPPED");

        return savedShipment;
    }

    @Transactional
    public Shipment simulateCourierEvent(UUID shipmentId, ShipmentStatus targetStatus, String location, String activity) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update tracking for a cancelled shipment.");
        }

        String loc = (location != null && !location.isBlank()) ? location : "Central Logistics Hub";
        String act = (activity != null && !activity.isBlank()) ? activity : "Courier tracking scan: " + targetStatus;

        shipment.setStatus(targetStatus);
        if (targetStatus == ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(ZonedDateTime.now());
        }

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(shipment.getAwbCode())
                .currentStatus(targetStatus.name())
                .location(loc)
                .activity(act)
                .timestamp(ZonedDateTime.now())
                .eventDataJson("{\"status\":\"" + targetStatus.name() + "\",\"source\":\"COURIER_CARRIER_SIMULATION\"}")
                .build();

        shipment.addTrackingEvent(tracking);
        Shipment saved = shipmentRepository.save(shipment);

        if (targetStatus == ShipmentStatus.DELIVERED) {
            orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED, "Order delivered via courier partner scan", "COURIER_SYSTEM");
            recordShipmentNotification(saved, com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED, "DELIVERED");
        } else if (targetStatus == ShipmentStatus.IN_TRANSIT) {
            recordShipmentNotification(saved, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
        }

        return saved;
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

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            log.info("Shipment for AWB {} is already in terminal DELIVERED status; ignoring webhook transition to {}", awbCode, currentStatus);
            return;
        }

        boolean isDuplicateScan = shipment.getTrackingEvents() != null && shipment.getTrackingEvents().stream()
                .anyMatch(t -> currentStatus != null && currentStatus.equalsIgnoreCase(t.getCurrentStatus())
                        && ((activity == null && t.getActivity() == null) || (activity != null && activity.equalsIgnoreCase(t.getActivity()))));
        if (isDuplicateScan) {
            log.info("Ignoring duplicate webhook tracking scan for AWB {}: status={}, activity={}", awbCode, currentStatus, activity);
            return;
        }

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
                                    : buildTrackingUrl(shipment.getAwbCode()),
                            "status", statusLabel
                    ),
                    eventType.name() + ":" + shipment.getId()
            );

        } catch (Exception e) {
            log.error("Failed to record shipment notification for shipment {}: {}", shipment.getId(), e.getMessage());
        }
    }

    public String buildTrackingUrl(String awbCode) {
        if (awbCode == null || awbCode.isBlank()) return "";
        String base = trackingBaseUrl != null ? trackingBaseUrl.trim() : "https://track.shiprocket.in/";
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + awbCode.trim();
    }
}
