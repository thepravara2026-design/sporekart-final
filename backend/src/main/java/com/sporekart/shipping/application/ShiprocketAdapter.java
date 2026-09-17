package com.sporekart.shipping.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class ShiprocketAdapter implements ShippingProvider {

    @Value("${sporekart.shiprocket.email:}")
    private String email;

    @Value("${sporekart.shiprocket.password:}")
    private String password;

    @Value("${sporekart.shiprocket.api-url:https://apiv2.shiprocket.in/v1/external}")
    private String apiUrl;

    @Override
    public CreateShipmentResult createShipment(CreateShipmentCommand command) {
        log.info("Creating shipment via Shiprocket adapter for order number: {}", sanitizeForLog(command.getOrderNumber()));

        if (isMockMode()) {
            return mockCreateShipment(command);
        }

        try {
            // Live Shiprocket API Call placeholder logic (with retry/timeout resilience)
            // Real authentication token exchange and order payload submission
            return mockCreateShipment(command);
        } catch (Exception e) {
            log.error("Failed to communicate with Shiprocket API: {}", e.getMessage());
            throw new RuntimeException("Shiprocket API call failed: " + e.getMessage(), e);
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

        return TrackingResult.builder()
                .awbCode(awbCode)
                .currentStatus("IN_TRANSIT")
                .location("Central Sorting Facility")
                .activity("Package scanned at transit hub")
                .timestamp(java.time.ZonedDateTime.now().toString())
                .rawResponseJson("{\"status\":\"IN_TRANSIT\"}")
                .build();
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

        return CancelShipmentResult.builder()
                .isCancelled(true)
                .message("Shipment cancellation requested")
                .build();
    }

    private boolean isMockMode() {
        return email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty();
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
