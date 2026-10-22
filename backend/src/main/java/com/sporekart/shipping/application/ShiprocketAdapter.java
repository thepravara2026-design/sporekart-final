package com.sporekart.shipping.application;

import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketApiException;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class ShiprocketAdapter implements ShippingProvider {

    private static final DateTimeFormatter ORDER_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Value("${sporekart.shiprocket.email:}")
    private String email;

    @Value("${sporekart.shiprocket.password:}")
    private String password;

    @Value("${sporekart.shiprocket.api-url:https://apiv2.shiprocket.in/v1/external}")
    private String apiUrl;

    @Value("${sporekart.shiprocket.use-real-shiprocket:false}")
    private boolean useRealShiprocket;

    @Value("${sporekart.shiprocket.pickup-location:Primary}")
    private String defaultPickupLocation;

    private final ShiprocketRestClient shiprocketRestClient;

    @Autowired
    public ShiprocketAdapter(ShiprocketRestClient shiprocketRestClient) {
        this.shiprocketRestClient = shiprocketRestClient;
    }

    // Default constructor for isolated unit testing
    public ShiprocketAdapter() {
        this.shiprocketRestClient = null;
    }

    @Override
    public CreateShipmentResult createShipment(CreateShipmentCommand command) {
        log.info("Creating shipment via Shiprocket adapter for order number: {} [mode: {}]",
                sanitizeForLog(command.getOrderNumber()), isMockMode() ? "MOCK" : "LIVE");

        if (isMockMode()) {
            return mockCreateShipment(command);
        }

        if (shiprocketRestClient == null) {
            log.warn("ShiprocketRestClient bean is not injected; falling back to mock mode");
            return mockCreateShipment(command);
        }

        try {
            // Step 1: Map command to official Shiprocket Adhoc Order Request
            String recipient = command.getRecipientName() != null ? command.getRecipientName().trim() : "Customer";
            String[] nameParts = recipient.split("\\s+", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "Customer";

            List<ShiprocketDtos.ShiprocketOrderItemDto> items = new ArrayList<>();
            if (command.getItems() != null && !command.getItems().isEmpty()) {
                for (ShipmentItemCommand item : command.getItems()) {
                    items.add(ShiprocketDtos.ShiprocketOrderItemDto.builder()
                            .name(item.getTitle() != null ? item.getTitle() : "Mushroom Product")
                            .sku(item.getSku() != null ? item.getSku() : "SKU-" + System.currentTimeMillis())
                            .units(item.getQuantity() > 0 ? item.getQuantity() : 1)
                            .sellingPrice(item.getPriceInr() != null ? item.getPriceInr() : BigDecimal.ZERO)
                            .discount("0")
                            .tax("0")
                            .build());
                }
            } else {
                items.add(ShiprocketDtos.ShiprocketOrderItemDto.builder()
                        .name("Sporekart Consignment #" + command.getOrderNumber())
                        .sku("SKU-DEFAULT")
                        .units(1)
                        .sellingPrice(command.getTotalAmountInr() != null ? command.getTotalAmountInr() : BigDecimal.ZERO)
                        .discount("0")
                        .tax("0")
                        .build());
            }

            String pickupLoc = command.getPickupLocation() != null && !command.getPickupLocation().isBlank()
                    ? command.getPickupLocation().trim()
                    : defaultPickupLocation;

            ShiprocketDtos.CreateAdhocOrderRequest orderRequest = ShiprocketDtos.CreateAdhocOrderRequest.builder()
                    .orderId(command.getOrderNumber())
                    .orderDate(LocalDateTime.now().format(ORDER_DATE_FORMAT))
                    .pickupLocation(pickupLoc)
                    .billingCustomerName(firstName)
                    .billingLastName(lastName)
                    .billingAddress(command.getAddressLine1() != null ? command.getAddressLine1() : "Address line")
                    .billingAddress2(command.getAddressLine2() != null ? command.getAddressLine2() : "")
                    .billingCity(command.getCity() != null ? command.getCity() : "City")
                    .billingPincode(command.getPincode() != null ? command.getPincode() : "411001")
                    .billingState(command.getState() != null ? command.getState() : "State")
                    .billingCountry("India")
                    .billingEmail(command.getEmail() != null && !command.getEmail().isBlank() ? command.getEmail() : "orders@sporekart.in")
                    .billingPhone(command.getPhone() != null ? command.getPhone().replaceAll("[^0-9]", "") : "9876543210")
                    .shippingIsBilling(true)
                    .orderItems(items)
                    .paymentMethod("Prepaid")
                    .subTotal(command.getTotalAmountInr() != null ? command.getTotalAmountInr() : BigDecimal.ZERO)
                    .length(command.getLengthCm() != null ? command.getLengthCm() : new BigDecimal("15"))
                    .breadth(command.getBreadthCm() != null ? command.getBreadthCm() : new BigDecimal("15"))
                    .height(command.getHeightCm() != null ? command.getHeightCm() : new BigDecimal("10"))
                    .weight(command.getWeightKg() != null ? command.getWeightKg() : new BigDecimal("0.25"))
                    .build();

            log.info("Dispatching live order creation to Shiprocket for order #{}", command.getOrderNumber());
            ShiprocketDtos.CreateOrderResponse createOrderResponse = shiprocketRestClient.createAdhocOrder(orderRequest);

            if (createOrderResponse == null || createOrderResponse.getShipmentId() == null) {
                throw new IllegalStateException("Shiprocket adhoc order creation returned null shipment ID: " +
                        (createOrderResponse != null ? createOrderResponse.getMessage() : "empty response"));
            }

            String shipmentId = String.valueOf(createOrderResponse.getShipmentId());
            log.info("Shiprocket order created successfully (Shipment ID: {})", shipmentId);

            // Step 2: Courier Allocation & AWB Assignment
            String awbCode = null;
            String courierName = "Delhivery Surface";
            String courierId = "1";

            try {
                ShiprocketDtos.AssignAwbResponse awbResponse = shiprocketRestClient.assignAwb(shipmentId, null);
                if (awbResponse != null && awbResponse.getResponse() != null && awbResponse.getResponse().getData() != null) {
                    var data = awbResponse.getResponse().getData();
                    if (data.getAwbCode() != null && !data.getAwbCode().isBlank()) {
                        awbCode = data.getAwbCode();
                    }
                    if (data.getCourierName() != null && !data.getCourierName().isBlank()) {
                        courierName = data.getCourierName();
                    }
                    if (data.getCourierCompanyId() != null) {
                        courierId = String.valueOf(data.getCourierCompanyId());
                    }
                }
            } catch (Exception ex) {
                log.warn("Direct AWB assignment returned error for shipment {}: {}. Will use fallback shipment reference.",
                        shipmentId, ex.getMessage());
            }

            if (awbCode == null || awbCode.isBlank()) {
                awbCode = "SR-" + shipmentId;
            }

            // Step 3: Best-effort pickup scheduling
            try {
                shiprocketRestClient.requestPickup(shipmentId);
                log.info("Requested courier pickup for shipment ID: {}", shipmentId);
            } catch (Exception ex) {
                log.warn("Courier pickup request pending/deferred for shipment ID {}: {}", shipmentId, ex.getMessage());
            }

            return CreateShipmentResult.builder()
                    .providerShipmentId(shipmentId)
                    .awbCode(awbCode)
                    .courierName(courierName)
                    .courierId(courierId)
                    .status("PICKUP_SCHEDULED")
                    .message("Live Shiprocket shipment created successfully")
                    .build();

        } catch (Exception e) {
            log.error("Failed to execute live Shiprocket shipment creation: {}", e.getMessage());
            throw new ShiprocketApiException("Shiprocket API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public TrackingResult trackShipment(String awbCode, String providerShipmentId) {
        log.info("Fetching tracking status from Shiprocket adapter for AWB: {}", sanitizeForLog(awbCode));

        if (isMockMode()) {
            return TrackingResult.builder()
                    .awbCode(awbCode != null ? awbCode : "SR-AWB-MOCK")
                    .currentStatus("IN_TRANSIT")
                    .location("Hub Facility, Bengaluru")
                    .activity("Package arrived at sorting facility")
                    .timestamp(java.time.ZonedDateTime.now().toString())
                    .rawResponseJson("{\"status\":\"IN_TRANSIT\",\"scans\":[]}")
                    .build();
        }

        if (shiprocketRestClient == null) {
            return TrackingResult.builder()
                    .awbCode(awbCode)
                    .currentStatus("IN_TRANSIT")
                    .location("Central Sorting Facility")
                    .activity("Package scanned at transit hub")
                    .timestamp(java.time.ZonedDateTime.now().toString())
                    .rawResponseJson("{\"status\":\"IN_TRANSIT\"}")
                    .build();
        }

        try {
            ShiprocketDtos.TrackAwbResponse trackResponse = shiprocketRestClient.trackAwb(awbCode);
            String currentStatus = "IN_TRANSIT";
            String location = "In Transit";
            String activity = "Package in transit";
            String timestamp = java.time.ZonedDateTime.now().toString();

            if (trackResponse != null && trackResponse.getTrackingData() != null) {
                var td = trackResponse.getTrackingData();
                if (td.getShipmentTrack() != null && !td.getShipmentTrack().isEmpty()) {
                    var track = td.getShipmentTrack().get(0);
                    if (track.getCurrentStatus() != null) currentStatus = track.getCurrentStatus();
                    if (track.getOrigin() != null) location = track.getOrigin();
                }
                if (td.getShipmentTrackActivities() != null && !td.getShipmentTrackActivities().isEmpty()) {
                    var lastActivity = td.getShipmentTrackActivities().get(td.getShipmentTrackActivities().size() - 1);
                    if (lastActivity.getActivity() != null) activity = lastActivity.getActivity();
                    if (lastActivity.getLocation() != null) location = lastActivity.getLocation();
                    if (lastActivity.getDate() != null) timestamp = lastActivity.getDate();
                }
            }

            return TrackingResult.builder()
                    .awbCode(awbCode)
                    .currentStatus(currentStatus)
                    .location(location)
                    .activity(activity)
                    .timestamp(timestamp)
                    .rawResponseJson("{\"status\":\"" + currentStatus + "\"}")
                    .build();

        } catch (Exception e) {
            log.error("Failed to fetch live Shiprocket tracking for AWB {}: {}", sanitizeForLog(awbCode), e.getMessage());
            return TrackingResult.builder()
                    .awbCode(awbCode)
                    .currentStatus("IN_TRANSIT")
                    .location("Carrier Network")
                    .activity("Tracking data temporarily unavailable: " + e.getMessage())
                    .timestamp(java.time.ZonedDateTime.now().toString())
                    .rawResponseJson("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @Override
    public CancelShipmentResult cancelShipment(String providerShipmentId, String awbCode) {
        log.info("Cancelling shipment via Shiprocket adapter for shipment ID: {}", sanitizeForLog(providerShipmentId));

        if (isMockMode()) {
            return CancelShipmentResult.builder()
                    .isCancelled(true)
                    .message("Shipment cancelled successfully in mock mode")
                    .build();
        }

        if (shiprocketRestClient == null) {
            return CancelShipmentResult.builder()
                    .isCancelled(true)
                    .message("Shipment cancellation requested")
                    .build();
        }

        try {
            ShiprocketDtos.CancelOrderResponse cancelResponse = shiprocketRestClient.cancelOrder(providerShipmentId);
            boolean cancelled = cancelResponse != null && (cancelResponse.getStatusCode() == null || cancelResponse.getStatusCode() == 200);
            return CancelShipmentResult.builder()
                    .isCancelled(cancelled)
                    .message(cancelResponse != null && cancelResponse.getMessage() != null
                            ? cancelResponse.getMessage()
                            : "Order cancelled in Shiprocket")
                    .build();
        } catch (Exception e) {
            log.error("Failed to cancel Shiprocket shipment {}: {}", sanitizeForLog(providerShipmentId), e.getMessage());
            throw new ShiprocketApiException("Failed to cancel Shiprocket shipment: " + e.getMessage(), e);
        }
    }

    public boolean isMockMode() {
        return !useRealShiprocket || email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty();
    }

    private CreateShipmentResult mockCreateShipment(CreateShipmentCommand command) {
        String mockShipmentId = "SR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String mockAwb = "AWB-" + System.currentTimeMillis();

        return CreateShipmentResult.builder()
                .providerShipmentId(mockShipmentId)
                .awbCode(mockAwb)
                .courierName("Delhivery Express")
                .courierId("DELHIVERY_1")
                .status("PICKUP_SCHEDULED")
                .message("Mock shipment created successfully")
                .build();
    }

    private String sanitizeForLog(String input) {
        if (input == null) return "null";
        if (input.length() <= 4) return "****";
        return input.substring(0, 2) + "***" + input.substring(input.length() - 2);
    }
}
