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
import com.sporekart.shared.application.ResourceNotFoundException;
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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.pickup-location:Primary}")
    private String pickupLocation;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.pickup-pincode:411001}")
    private String pickupPincode;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.tracking-base-url:https://track.shiprocket.in/}")
    private String trackingBaseUrl;

    private <T> T executeInTransaction(java.util.function.Supplier<T> action) {
        if (transactionTemplate != null) {
            return transactionTemplate.execute(status -> action.get());
        } else {
            return action.get();
        }
    }

    private void executeInTransactionWithoutResult(Runnable action) {
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> action.run());
        } else {
            action.run();
        }
    }

    @Transactional
    public Shipment createShipmentForOrder(UUID orderId) {
        Optional<Shipment> existing = shipmentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return existing.get();
        }

        OrderResponse order = orderService.getOrderById(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Cannot create courier shipment for a cancelled or refunded order (Order #"
                    + order.getOrderNumber() + ")");
        }
        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Cannot create courier shipment for order #" + order.getOrderNumber()
                    + " with status " + order.getStatus() + ". Order must be PAID or CONFIRMED.");
        }

        OrderAddressSnapshot addr = order.getShippingAddress();
        if (addr == null) {
            throw new IllegalStateException("Order #" + order.getOrderNumber() + " has no shipping address");
        }
        if (addr.getRecipientName() == null || addr.getRecipientName().trim().length() < 2) {
            throw new IllegalArgumentException("Shipping recipient name is required and must be at least 2 characters");
        }
        if (addr.getLine1() == null || addr.getLine1().trim().length() < 3) {
            throw new IllegalArgumentException("Shipping address line 1 is required and must be at least 3 characters");
        }
        if (addr.getCity() == null || addr.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping city is required");
        }
        if (addr.getState() == null || addr.getState().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping state is required");
        }
        if (addr.getPincode() == null || !addr.getPincode().trim().matches("^[1-9][0-9]{5}$")) {
            throw new IllegalArgumentException("Valid 6-digit Indian delivery pincode is required");
        }
        String cleanPhone = addr.getPhone() != null ? addr.getPhone().replaceAll("[^0-9]", "") : "";
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
        }
        if (!cleanPhone.matches("^[6-9][0-9]{9}$")) {
            throw new IllegalArgumentException("Valid 10-digit Indian mobile contact number is required");
        }

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
                if (itemLength.compareTo(maxLengthCm) > 0)
                    maxLengthCm = itemLength;
                if (itemBreadth.compareTo(maxBreadthCm) > 0)
                    maxBreadthCm = itemBreadth;
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
                .recipientName(addr.getRecipientName().trim())
                .phone(cleanPhone)
                .email(addr.getEmail() != null ? addr.getEmail().trim() : "")
                .addressLine1(addr.getLine1().trim())
                .addressLine2(addr.getLine2() != null ? addr.getLine2().trim() : "")
                .city(addr.getCity().trim())
                .state(addr.getState().trim())
                .pincode(addr.getPincode().trim())
                .country("India")
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
        } catch (Exception e) {
            log.warn("Failed to serialize shipping address for order {}: {}", orderId, e.getMessage());
        }

        boolean hasAwb = result.getAwbCode() != null && !result.getAwbCode().isBlank();
        ShipmentStatus initialStatus;
        if ("PICKUP_SCHEDULED".equalsIgnoreCase(result.getStatus())) {
            initialStatus = ShipmentStatus.PICKUP_SCHEDULED;
        } else if (hasAwb) {
            initialStatus = ShipmentStatus.AWB_ASSIGNED;
        } else {
            initialStatus = ShipmentStatus.AWB_PENDING;
        }

        Shipment shipment = Shipment.builder()
                .orderId(orderId)
                .orderNumber(order.getOrderNumber())
                .providerShipmentId(result.getProviderShipmentId())
                .awbCode(hasAwb ? result.getAwbCode() : null)
                .courierName(result.getCourierName() != null ? result.getCourierName() : "Delhivery Surface")
                .courierId(result.getCourierId() != null ? result.getCourierId() : "1")
                .status(initialStatus)
                .pickupScheduledAt(initialStatus == ShipmentStatus.PICKUP_SCHEDULED ? ZonedDateTime.now() : null)
                .shippingAddressJson(addrJson)
                .build();

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(hasAwb ? result.getAwbCode() : null)
                .currentStatus(initialStatus.name())
                .activity(result.getMessage() != null ? result.getMessage()
                        : (hasAwb ? "Shipment created and pickup scheduled with courier partner"
                                : "Shipment created in Shiprocket; AWB allocation pending"))
                .location(hasAwb ? "Warehouse Manifest Facility" : "Order Manifested")
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        Shipment savedShipment;
        try {
            savedShipment = shipmentRepository.save(shipment);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn(
                    "Duplicate concurrent shipment creation detected for order {}. Reconciling existing shipment record.",
                    orderId);
            return shipmentRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new IllegalStateException("Shipment conflict on order " + orderId, ex));
        }

        // Only mark order as SHIPPED when actual provider AWB has been confirmed
        if (hasAwb) {
            orderService.updateOrderShippingDetails(
                    orderId,
                    savedShipment.getCourierName(),
                    savedShipment.getAwbCode(),
                    buildTrackingUrl(savedShipment.getAwbCode()));
            orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, "Shipment created: " + result.getAwbCode(),
                    "SHIPPING_SERVICE");
            recordShipmentNotification(savedShipment,
                    com.sporekart.notification.domain.NotificationEventType.SHIPMENT_SHIPPED, "SHIPPED");
        } else {
            log.info(
                    "Shipment created for order {} with AWB_PENDING. Order status remains unchanged until AWB is allocated.",
                    orderId);
        }

        return savedShipment;
    }

    @Transactional
    public Shipment assignAwbForShipment(UUID shipmentId, String awbCode, String courierName, String courierId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getAwbCode() != null && !shipment.getAwbCode().isBlank()) {
            log.info("Shipment {} already has AWB assigned: {}", shipmentId, shipment.getAwbCode());
            return shipment;
        }

        if (awbCode == null || awbCode.isBlank() || awbCode.trim().length() < 6) {
            throw new IllegalArgumentException("Cannot assign invalid, blank, or short AWB code: " + awbCode);
        }

        shipment.setAwbCode(awbCode.trim());
        if (courierName != null && !courierName.isBlank()) {
            shipment.setCourierName(courierName.trim());
        }
        if (courierId != null && !courierId.isBlank()) {
            shipment.setCourierId(courierId.trim());
        }
        shipment.setStatus(ShipmentStatus.AWB_ASSIGNED);

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(awbCode.trim())
                .currentStatus("AWB_ASSIGNED")
                .location("Carrier Dispatch Facility")
                .activity("AWB allocated: " + awbCode.trim() + " via " + shipment.getCourierName()
                        + ". Awaiting courier pickup scheduling.")
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        Shipment saved = shipmentRepository.save(shipment);

        orderService.updateOrderShippingDetails(
                saved.getOrderId(),
                saved.getCourierName(),
                saved.getAwbCode(),
                buildTrackingUrl(saved.getAwbCode()));
        orderService.updateOrderStatus(saved.getOrderId(), OrderStatus.SHIPPED, "AWB assigned: " + awbCode.trim(),
                "SHIPPING_SERVICE");
        recordShipmentNotification(saved, com.sporekart.notification.domain.NotificationEventType.SHIPMENT_SHIPPED,
                "SHIPPED");

        return saved;
    }

    @Transactional
    public Shipment schedulePickupForShipment(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot schedule pickup for a cancelled shipment.");
        }
        if (shipment.getAwbCode() == null || shipment.getAwbCode().isBlank()) {
            throw new IllegalStateException("Cannot schedule pickup before AWB is assigned.");
        }

        shipment.setStatus(ShipmentStatus.PICKUP_SCHEDULED);
        shipment.setPickupScheduledAt(ZonedDateTime.now());

        ShipmentTracking tracking = ShipmentTracking.builder()
                .shipment(shipment)
                .awbCode(shipment.getAwbCode())
                .currentStatus("PICKUP_SCHEDULED")
                .location("Carrier Hub")
                .activity("Carrier pickup scheduled. Courier partner notified for consignment collection.")
                .timestamp(ZonedDateTime.now())
                .build();
        shipment.addTrackingEvent(tracking);

        return shipmentRepository.save(shipment);
    }

    @Transactional
    public Shipment simulateCourierEvent(UUID shipmentId, ShipmentStatus targetStatus, String location,
            String activity) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update tracking for a cancelled shipment.");
        }
        if (shipment.getStatus() == ShipmentStatus.DELIVERED && targetStatus != ShipmentStatus.DELIVERED) {
            throw new IllegalStateException("Cannot regress status of a DELIVERED shipment.");
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
            orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED,
                    "Order delivered via courier partner scan", "COURIER_SYSTEM");
            recordShipmentNotification(saved, com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED,
                    "DELIVERED");
        } else if (targetStatus == ShipmentStatus.OUT_FOR_DELIVERY) {
            recordShipmentNotification(saved,
                    com.sporekart.notification.domain.NotificationEventType.SHIPMENT_OUT_FOR_DELIVERY,
                    "OUT_FOR_DELIVERY");
        } else if (targetStatus == ShipmentStatus.IN_TRANSIT) {
            recordShipmentNotification(saved,
                    com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
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

    public ShipmentTracking updateTrackingStatus(UUID shipmentId) {
        // Step 1: Read shipment details in short read transaction
        record ShipmentLookup(Shipment shipment, String awbCode, String providerShipmentId, ShipmentStatus status,
                ShipmentTracking terminalTracking) {
        }

        ShipmentLookup lookup = executeInTransaction(() -> {
            Shipment shipment = shipmentRepository.findById(shipmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

            if (shipment.getStatus() == ShipmentStatus.DELIVERED || shipment.getStatus() == ShipmentStatus.CANCELLED) {
                log.info("Shipment {} is already in terminal {} status; returning latest tracking event", shipmentId,
                        shipment.getStatus());
                if (shipment.getTrackingEvents() != null && !shipment.getTrackingEvents().isEmpty()) {
                    return new ShipmentLookup(shipment, shipment.getAwbCode(), shipment.getProviderShipmentId(),
                            shipment.getStatus(),
                            shipment.getTrackingEvents().get(shipment.getTrackingEvents().size() - 1));
                }
            }
            return new ShipmentLookup(shipment, shipment.getAwbCode(), shipment.getProviderShipmentId(),
                    shipment.getStatus(), null);
        });

        if (lookup.terminalTracking() != null) {
            return lookup.terminalTracking();
        }

        // Step 2: Outbound HTTP tracking call executed outside database transaction
        ShippingProvider.TrackingResult trackingResult = shippingProvider.trackShipment(lookup.awbCode(),
                lookup.providerShipmentId());

        if (trackingResult == null || "TRACKING_UNAVAILABLE".equalsIgnoreCase(trackingResult.getCurrentStatus())) {
            log.warn(
                    "Carrier tracking temporarily unavailable for shipment ID {} / AWB {}. Retaining current status {} without persisting duplicate junk rows.",
                    shipmentId, lookup.awbCode(), lookup.status());
            if (lookup.shipment().getTrackingEvents() != null && !lookup.shipment().getTrackingEvents().isEmpty()) {
                return lookup.shipment().getTrackingEvents().get(lookup.shipment().getTrackingEvents().size() - 1);
            }
            // Return transient tracking status without polluting database with duplicate
            // unavailable rows
            return ShipmentTracking.builder()
                    .shipment(lookup.shipment())
                    .awbCode(lookup.awbCode())
                    .currentStatus(lookup.status().name())
                    .location("Carrier Dispatch")
                    .activity("Live courier tracking update pending carrier network sync. Please check back shortly.")
                    .timestamp(ZonedDateTime.now())
                    .eventDataJson("{\"status\":\"" + lookup.status().name() + "\",\"liveTrackingAvailable\":false}")
                    .build();
        }

        // Step 3: Persist tracking update inside dedicated short transaction
        return executeInTransaction(() -> {
            Shipment shipment = shipmentRepository.findById(shipmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

            // Deduplication: ignore if identical status and activity was just recorded
            if (shipment.getTrackingEvents() != null && !shipment.getTrackingEvents().isEmpty()) {
                ShipmentTracking last = shipment.getTrackingEvents().get(shipment.getTrackingEvents().size() - 1);
                if (trackingResult.getCurrentStatus().equalsIgnoreCase(last.getCurrentStatus())
                        && ((trackingResult.getActivity() == null && last.getActivity() == null)
                                || (trackingResult.getActivity() != null
                                        && trackingResult.getActivity().equalsIgnoreCase(last.getActivity())))) {
                    log.info("Ignoring duplicate tracking scan for AWB {}: status={}", shipment.getAwbCode(),
                            trackingResult.getCurrentStatus());
                    return last;
                }
            }

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
                orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED, "Order delivered",
                        "SHIPPING_SERVICE");
                recordShipmentNotification(shipment,
                        com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED, "DELIVERED");
            } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(trackingResult.getCurrentStatus())
                    && shipment.getStatus() != ShipmentStatus.DELIVERED) {
                shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
                recordShipmentNotification(shipment,
                        com.sporekart.notification.domain.NotificationEventType.SHIPMENT_OUT_FOR_DELIVERY,
                        "OUT_FOR_DELIVERY");
            } else if ("IN_TRANSIT".equalsIgnoreCase(trackingResult.getCurrentStatus())
                    && shipment.getStatus() != ShipmentStatus.DELIVERED) {
                shipment.setStatus(ShipmentStatus.IN_TRANSIT);
                recordShipmentNotification(shipment,
                        com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
            }

            shipment.addTrackingEvent(tracking);
            shipmentRepository.save(shipment);

            return tracking;
        });
    }

    @Transactional
    public void processWebhookUpdate(String awbCode, String currentStatus, String location, String activity,
            String rawJson) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findByAwbCode(awbCode);
        if (shipmentOpt.isEmpty()) {
            log.warn("Received shipping webhook for unknown AWB: {}", awbCode);
            return;
        }

        Shipment shipment = shipmentOpt.get();

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            log.info("Shipment for AWB {} is already in terminal CANCELLED status; ignoring webhook transition to {}",
                    awbCode, currentStatus);
            return;
        }

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            log.info("Shipment for AWB {} is already in terminal DELIVERED status; ignoring webhook transition to {}",
                    awbCode, currentStatus);
            return;
        }

        boolean isDuplicateScan = shipment.getTrackingEvents() != null && shipment.getTrackingEvents().stream()
                .anyMatch(t -> currentStatus != null && currentStatus.equalsIgnoreCase(t.getCurrentStatus())
                        && ((activity == null && t.getActivity() == null)
                                || (activity != null && activity.equalsIgnoreCase(t.getActivity()))));
        if (isDuplicateScan) {
            log.info("Ignoring duplicate webhook tracking scan for AWB {}: status={}, activity={}", awbCode,
                    currentStatus, activity);
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
            orderService.updateOrderStatus(shipment.getOrderId(), OrderStatus.DELIVERED, "Delivered via webhook",
                    "SHIPROCKET_WEBHOOK");
            recordShipmentNotification(shipment,
                    com.sporekart.notification.domain.NotificationEventType.ORDER_DELIVERED, "DELIVERED");
        } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(currentStatus)) {
            shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
            recordShipmentNotification(shipment,
                    com.sporekart.notification.domain.NotificationEventType.SHIPMENT_OUT_FOR_DELIVERY,
                    "OUT_FOR_DELIVERY");
        } else if ("IN_TRANSIT".equalsIgnoreCase(currentStatus)) {
            shipment.setStatus(ShipmentStatus.IN_TRANSIT);
            recordShipmentNotification(shipment,
                    com.sporekart.notification.domain.NotificationEventType.SHIPMENT_IN_TRANSIT, "IN_TRANSIT");
        }

        shipment.addTrackingEvent(tracking);
        shipmentRepository.save(shipment);
    }

    @Transactional(readOnly = true)
    public String getShippingLabelUrl(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot generate shipping label for a CANCELLED shipment.");
        }

        return shippingProvider.generateLabel(shipment.getProviderShipmentId(), shipment.getAwbCode());
    }

    @Transactional
    public void cancelShipment(UUID shipmentId, String reason) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel an already delivered shipment");
        }
        if (shipment.getStatus() == ShipmentStatus.CANCELLED) {
            log.info("Shipment {} is already in CANCELLED status; no-op", shipmentId);
            return;
        }

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

    private void recordShipmentNotification(Shipment shipment,
            com.sporekart.notification.domain.NotificationEventType eventType, String statusLabel) {
        try {
            OrderResponse order = orderService.getOrderById(shipment.getOrderId());
            if (order == null)
                return;

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
                var userOpt = userRepository.findById(order.getUserId());
                if (userOpt.isPresent()) {
                    var user = userOpt.get();
                    if (user.getEmail() != null && user.getEmail().contains("@")) {
                        recipientEmail = user.getEmail();
                    }
                    if ((recipientPhone == null || recipientPhone.isBlank()) && user.getPhone() != null
                            && !user.getPhone().isBlank()) {
                        recipientPhone = user.getPhone();
                    }
                }
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
                            "status", statusLabel),
                    eventType.name() + ":" + shipment.getId());

        } catch (Exception e) {
            log.error("Failed to record shipment notification for shipment {}: {}", shipment.getId(), e.getMessage());
        }
    }

    public String buildTrackingUrl(String awbCode) {
        if (awbCode == null || awbCode.isBlank())
            return "";
        String base = trackingBaseUrl != null ? trackingBaseUrl.trim() : "https://track.shiprocket.in/";
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + awbCode.trim();
    }
}
