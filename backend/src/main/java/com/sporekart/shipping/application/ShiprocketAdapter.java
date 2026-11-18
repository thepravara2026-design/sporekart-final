package com.sporekart.shipping.application;

import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketApiException;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Component
@Primary
public class ShiprocketAdapter implements ShippingProvider {

    private static final DateTimeFormatter ORDER_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9][0-9]{9}$");

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

    @Autowired(required = false)
    private Environment environment;

    private final ShiprocketMockAdapter mockAdapter = new ShiprocketMockAdapter();

    @Autowired
    public ShiprocketAdapter(ShiprocketRestClient shiprocketRestClient) {
        this.shiprocketRestClient = shiprocketRestClient;
    }

    // Default constructor for isolated unit testing
    public ShiprocketAdapter() {
        this.shiprocketRestClient = null;
    }

    // Constructor with Environment for testing
    public ShiprocketAdapter(ShiprocketRestClient shiprocketRestClient, Environment environment) {
        this.shiprocketRestClient = shiprocketRestClient;
        this.environment = environment;
    }

    @Override
    public CreateShipmentResult createShipment(CreateShipmentCommand command) {
        log.info("Creating shipment via Shiprocket adapter for order number: {} [mode: {}]",
                sanitizeForLog(command != null ? command.getOrderNumber() : "null"), isMockMode() ? "MOCK" : "LIVE");

        if (isMockMode()) {
            if (isProductionEnvironment()) {
                throw new IllegalStateException("FAIL-CLOSED: Mock shipment creation is strictly forbidden in production environment");
            }
            return mockCreateShipment(command);
        }

        if (shiprocketRestClient == null) {
            log.error("FAIL-CLOSED: ShiprocketRestClient is unavailable. Real Shiprocket integration is required; mock fallback is disallowed.");
            throw new IllegalStateException("ShiprocketRestClient bean is unavailable. Real Shiprocket integration is required; mock fallback is disallowed.");
        }

        validateLiveCommand(command);

        try {
            // Step 1: Map command to official Shiprocket Adhoc Order Request
            String recipient = command.getRecipientName().trim();
            String[] nameParts = recipient.split("\\s+", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : firstName;

            List<ShiprocketDtos.ShiprocketOrderItemDto> items = new ArrayList<>();
            if (command.getItems() != null && !command.getItems().isEmpty()) {
                for (ShipmentItemCommand item : command.getItems()) {
                    items.add(ShiprocketDtos.ShiprocketOrderItemDto.builder()
                            .name(item.getTitle() != null ? item.getTitle() : "Mushroom Product")
                            .sku(item.getSku() != null ? item.getSku() : "SKU-" + command.getOrderNumber())
                            .units(item.getQuantity() > 0 ? item.getQuantity() : 1)
                            .sellingPrice(item.getPriceInr() != null ? item.getPriceInr() : BigDecimal.ZERO)
                            .discount("0")
                            .tax("0")
                            .build());
                }
            } else {
                items.add(ShiprocketDtos.ShiprocketOrderItemDto.builder()
                        .name("Sporekart Consignment #" + command.getOrderNumber())
                        .sku("SKU-" + command.getOrderNumber())
                        .units(1)
                        .sellingPrice(command.getTotalAmountInr() != null ? command.getTotalAmountInr() : BigDecimal.ZERO)
                        .discount("0")
                        .tax("0")
                        .build());
            }

            String pickupLoc = StringUtils.hasText(command.getPickupLocation())
                    ? command.getPickupLocation().trim()
                    : defaultPickupLocation;

            String cleanPhone = command.getPhone().replaceAll("[^0-9]", "");
            if (cleanPhone.length() > 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
            }

            String orderEmail = StringUtils.hasText(command.getEmail()) ? command.getEmail().trim() : "orders@sporekart.in";

            boolean hasSeparateBilling = StringUtils.hasText(command.getBillingAddressLine1())
                    && !command.getBillingAddressLine1().equalsIgnoreCase(command.getAddressLine1());

            String billingFirst = hasSeparateBilling ? (StringUtils.hasText(command.getBillingCustomerName()) ? command.getBillingCustomerName().trim() : firstName) : firstName;
            String billingLast = hasSeparateBilling ? "" : lastName;
            String billingAddr = hasSeparateBilling ? command.getBillingAddressLine1().trim() : command.getAddressLine1().trim();
            String billingAddr2 = hasSeparateBilling ? (command.getBillingAddressLine2() != null ? command.getBillingAddressLine2().trim() : "")
                    : (command.getAddressLine2() != null ? command.getAddressLine2().trim() : "");
            String billingCity = hasSeparateBilling ? (StringUtils.hasText(command.getBillingCity()) ? command.getBillingCity().trim() : command.getCity().trim()) : command.getCity().trim();
            String billingPincode = hasSeparateBilling ? (StringUtils.hasText(command.getBillingPincode()) ? command.getBillingPincode().trim() : command.getPincode().trim()) : command.getPincode().trim();
            String billingState = hasSeparateBilling ? (StringUtils.hasText(command.getBillingState()) ? command.getBillingState().trim() : command.getState().trim()) : command.getState().trim();
            String billingPhone = hasSeparateBilling && StringUtils.hasText(command.getBillingPhone()) ? command.getBillingPhone().replaceAll("[^0-9]", "") : cleanPhone;

            ShiprocketDtos.CreateAdhocOrderRequest orderRequest = ShiprocketDtos.CreateAdhocOrderRequest.builder()
                    .orderId(command.getOrderNumber())
                    .orderDate(LocalDateTime.now().format(ORDER_DATE_FORMAT))
                    .pickupLocation(pickupLoc)
                    .billingCustomerName(billingFirst)
                    .billingLastName(billingLast)
                    .billingAddress(billingAddr)
                    .billingAddress2(billingAddr2)
                    .billingCity(billingCity)
                    .billingPincode(billingPincode)
                    .billingState(billingState)
                    .billingCountry("India")
                    .billingEmail(orderEmail)
                    .billingPhone(billingPhone)
                    .shippingIsBilling(!hasSeparateBilling)
                    .shippingCustomerName(firstName)
                    .shippingLastName(lastName)
                    .shippingAddress(command.getAddressLine1().trim())
                    .shippingAddress2(command.getAddressLine2() != null ? command.getAddressLine2().trim() : "")
                    .shippingCity(command.getCity().trim())
                    .shippingPincode(command.getPincode().trim())
                    .shippingState(command.getState().trim())
                    .shippingCountry("India")
                    .shippingEmail(orderEmail)
                    .shippingPhone(cleanPhone)
                    .orderItems(items)
                    .paymentMethod("Prepaid")
                    .subTotal(command.getTotalAmountInr() != null ? command.getTotalAmountInr() : BigDecimal.ZERO)
                    .length(command.getLengthCm() != null ? command.getLengthCm() : new BigDecimal("15.00"))
                    .breadth(command.getBreadthCm() != null ? command.getBreadthCm() : new BigDecimal("15.00"))
                    .height(command.getHeightCm() != null ? command.getHeightCm() : new BigDecimal("10.00"))
                    .weight(command.getWeightKg() != null ? command.getWeightKg() : new BigDecimal("0.250"))
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
            boolean awbAssigned = false;

            try {
                ShiprocketDtos.AssignAwbResponse awbResponse = shiprocketRestClient.assignAwb(shipmentId, null);
                if (awbResponse != null && awbResponse.getResponse() != null && awbResponse.getResponse().getData() != null) {
                    var data = awbResponse.getResponse().getData();
                    if (StringUtils.hasText(data.getAwbCode())) {
                        awbCode = data.getAwbCode().trim();
                        awbAssigned = true;
                    }
                    if (StringUtils.hasText(data.getCourierName())) {
                        courierName = data.getCourierName().trim();
                    }
                    if (data.getCourierCompanyId() != null) {
                        courierId = String.valueOf(data.getCourierCompanyId());
                    }
                }
            } catch (Exception ex) {
                log.warn("Direct AWB assignment returned error for shipment {}: {}. Retaining AWB_PENDING state.",
                        shipmentId, ex.getMessage());
            }

            // CRITICAL: A locally generated identifier must NEVER be represented as an actual Shiprocket AWB
            if (!awbAssigned || !StringUtils.hasText(awbCode)) {
                log.warn("Shipment ID {} created, but AWB is pending carrier assignment. No synthetic AWB generated.", shipmentId);
                return CreateShipmentResult.builder()
                        .providerShipmentId(shipmentId)
                        .awbCode(null)
                        .courierName(courierName)
                        .courierId(courierId)
                        .status("AWB_PENDING")
                        .message("Live Shiprocket shipment created; AWB assignment is pending courier allocation")
                        .build();
            }

            // Step 3: Best-effort pickup scheduling (only when valid AWB exists)
            boolean pickupScheduled = false;
            try {
                shiprocketRestClient.requestPickup(shipmentId);
                pickupScheduled = true;
                log.info("Requested courier pickup for shipment ID: {}", shipmentId);
            } catch (Exception ex) {
                log.warn("Courier pickup request deferred for shipment ID {}: {}", shipmentId, ex.getMessage());
            }

            return CreateShipmentResult.builder()
                    .providerShipmentId(shipmentId)
                    .awbCode(awbCode)
                    .courierName(courierName)
                    .courierId(courierId)
                    .status(pickupScheduled ? "PICKUP_SCHEDULED" : "AWB_ASSIGNED")
                    .message(pickupScheduled ? "Live Shiprocket shipment created and pickup scheduled" : "Live Shiprocket shipment created; AWB allocated, pickup scheduling pending")
                    .build();

        } catch (ShiprocketApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to execute live Shiprocket shipment creation: {}", e.getMessage(), e);
            throw new ShiprocketApiException("Shiprocket API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public TrackingResult trackShipment(String awbCode, String providerShipmentId) {
        log.info("Fetching tracking status from Shiprocket adapter for AWB: {}", sanitizeForLog(awbCode));

        if (isMockMode()) {
            if (isProductionEnvironment()) {
                throw new IllegalStateException("FAIL-CLOSED: Mock tracking is strictly forbidden in production environment");
            }
            return mockAdapter.trackShipment(awbCode, providerShipmentId);
        }

        if (!StringUtils.hasText(awbCode)) {
            return TrackingResult.builder()
                    .awbCode(null)
                    .currentStatus("TRACKING_UNAVAILABLE")
                    .location(null)
                    .activity("AWB is pending or unassigned")
                    .timestamp(java.time.ZonedDateTime.now().toString())
                    .rawResponseJson("{\"status\":\"TRACKING_UNAVAILABLE\",\"reason\":\"NO_AWB\"}")
                    .build();
        }

        if (shiprocketRestClient == null) {
            log.error("FAIL-CLOSED: ShiprocketRestClient unavailable for tracking. Fabricated tracking rejected.");
            return TrackingResult.builder()
                    .awbCode(awbCode)
                    .currentStatus("TRACKING_UNAVAILABLE")
                    .location(null)
                    .activity("Shiprocket tracking client unavailable")
                    .timestamp(java.time.ZonedDateTime.now().toString())
                    .rawResponseJson("{\"status\":\"TRACKING_UNAVAILABLE\"}")
                    .build();
        }

        try {
            ShiprocketDtos.TrackAwbResponse trackResponse = shiprocketRestClient.trackAwb(awbCode);

            if (trackResponse == null || trackResponse.getTrackingData() == null
                    || trackResponse.getTrackingData().getShipmentTrack() == null
                    || trackResponse.getTrackingData().getShipmentTrack().isEmpty()) {
                return TrackingResult.builder()
                        .awbCode(awbCode)
                        .currentStatus("TRACKING_UNAVAILABLE")
                        .location(null)
                        .activity("Tracking data not yet posted by carrier")
                        .timestamp(java.time.ZonedDateTime.now().toString())
                        .rawResponseJson("{\"status\":\"TRACKING_UNAVAILABLE\"}")
                        .build();
            }

            var td = trackResponse.getTrackingData();
            var track = td.getShipmentTrack().get(0);
            String currentStatus = track.getCurrentStatus() != null ? track.getCurrentStatus().trim().toUpperCase() : "IN_TRANSIT";
            String location = track.getOrigin();
            String activity = "Consignment in transit with courier partner";
            String timestamp = java.time.ZonedDateTime.now().toString();

            if (td.getShipmentTrackActivities() != null && !td.getShipmentTrackActivities().isEmpty()) {
                var lastActivity = td.getShipmentTrackActivities().get(td.getShipmentTrackActivities().size() - 1);
                if (StringUtils.hasText(lastActivity.getActivity())) activity = lastActivity.getActivity();
                if (StringUtils.hasText(lastActivity.getLocation())) location = lastActivity.getLocation();
                if (StringUtils.hasText(lastActivity.getDate())) timestamp = lastActivity.getDate();
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
                    .currentStatus("TRACKING_UNAVAILABLE")
                    .location(null)
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
            if (isProductionEnvironment()) {
                throw new IllegalStateException("FAIL-CLOSED: Mock cancellation is strictly forbidden in production environment");
            }
            return mockAdapter.cancelShipment(providerShipmentId, awbCode);
        }

        if (!StringUtils.hasText(providerShipmentId)) {
            throw new IllegalArgumentException("Provider shipment ID cannot be blank for cancellation");
        }

        if (shiprocketRestClient == null) {
            throw new IllegalStateException("ShiprocketRestClient is unavailable. Real shipment cancellation cannot be executed.");
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

    @Override
    public String generateLabel(String providerShipmentId, String awbCode) {
        log.info("Generating shipping label via Shiprocket adapter for shipment: {} [mode: {}]",
                sanitizeForLog(providerShipmentId), isMockMode() ? "MOCK" : "LIVE");

        if (isMockMode()) {
            if (isProductionEnvironment()) {
                throw new IllegalStateException("FAIL-CLOSED: Mock label generation is strictly forbidden in production environment");
            }
            return mockAdapter.generateLabel(providerShipmentId, awbCode);
        }

        if (shiprocketRestClient == null) {
            throw new IllegalStateException("ShiprocketRestClient is unavailable. Real label generation requires client.");
        }

        try {
            ShiprocketDtos.GenerateLabelResponse labelResponse = shiprocketRestClient.generateLabel(providerShipmentId);
            if (labelResponse != null && StringUtils.hasText(labelResponse.getLabelUrl())) {
                return labelResponse.getLabelUrl();
            }
            if (isProductionEnvironment()) {
                throw new ShiprocketApiException("Shiprocket label generation failed: provider returned empty label URL for shipment " + sanitizeForLog(providerShipmentId));
            }
            return "https://track.shiprocket.in/label/" + (awbCode != null ? awbCode : providerShipmentId);
        } catch (ShiprocketApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to generate live Shiprocket label for shipment {}: {}", sanitizeForLog(providerShipmentId), e.getMessage());
            if (isProductionEnvironment()) {
                throw new ShiprocketApiException("Shiprocket label generation failed: " + e.getMessage(), e);
            }
            return "https://track.shiprocket.in/label/" + (awbCode != null ? awbCode : providerShipmentId);
        }
    }

    @Override
    public boolean isMockMode() {
        if (isProductionEnvironment()) {
            return false;
        }
        return !useRealShiprocket || email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty();
    }

    public boolean isProductionEnvironment() {
        if (environment != null) {
            return environment.acceptsProfiles(Profiles.of("prod", "production"))
                    || (!environment.acceptsProfiles(Profiles.of("dev", "test", "staging")) && !environment.acceptsProfiles(Profiles.of("default")));
        }
        return false;
    }

    private CreateShipmentResult mockCreateShipment(CreateShipmentCommand command) {
        return mockAdapter.createShipment(command);
    }

    private void validateLiveCommand(CreateShipmentCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("CreateShipmentCommand cannot be null");
        }
        if (!StringUtils.hasText(command.getOrderNumber())) {
            throw new IllegalArgumentException("Order number cannot be blank");
        }
        if (!StringUtils.hasText(command.getRecipientName()) || command.getRecipientName().trim().length() < 2) {
            throw new IllegalArgumentException("Recipient name must be at least 2 characters long");
        }
        if (!StringUtils.hasText(command.getAddressLine1()) || command.getAddressLine1().trim().length() < 3) {
            throw new IllegalArgumentException("Shipping address line 1 must be at least 3 characters long");
        }
        if (!StringUtils.hasText(command.getCity())) {
            throw new IllegalArgumentException("Shipping city cannot be blank");
        }
        if (!StringUtils.hasText(command.getState())) {
            throw new IllegalArgumentException("Shipping state cannot be blank");
        }
        if (!StringUtils.hasText(command.getPincode()) || !PINCODE_PATTERN.matcher(command.getPincode().trim()).matches()) {
            throw new IllegalArgumentException("Delivery pincode must be a valid 6-digit Indian postal code");
        }

        String rawPhone = command.getPhone() != null ? command.getPhone().replaceAll("[^0-9]", "") : "";
        if (rawPhone.length() > 10) {
            rawPhone = rawPhone.substring(rawPhone.length() - 10);
        }
        if (!PHONE_PATTERN.matcher(rawPhone).matches()) {
            throw new IllegalArgumentException("Contact phone must be a valid 10-digit Indian mobile number");
        }

        if (command.getWeightKg() == null || command.getWeightKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Package weight must be greater than zero kg");
        }
        if (command.getLengthCm() == null || command.getLengthCm().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Package length must be greater than zero cm");
        }
        if (command.getBreadthCm() == null || command.getBreadthCm().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Package breadth must be greater than zero cm");
        }
        if (command.getHeightCm() == null || command.getHeightCm().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Package height must be greater than zero cm");
        }
    }

    private String sanitizeForLog(String input) {
        if (input == null) return "null";
        if (input.length() <= 4) return "****";
        return input.substring(0, 2) + "***" + input.substring(input.length() - 2);
    }
}
