package com.sporekart.shipping.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Non-production mock shipping provider adapter for development and testing environments.
 * Strictly prohibited in production runtime paths.
 */
@Slf4j
@Component("shiprocketMockAdapter")
public class ShiprocketMockAdapter implements ShippingProvider {

    @Override
    public CreateShipmentResult createShipment(CreateShipmentCommand command) {
        log.info("Creating mock shipment for order number: {}", command != null ? command.getOrderNumber() : "null");
        String mockShipmentId = "SR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String mockAwb = "AWB-" + System.currentTimeMillis();

        return CreateShipmentResult.builder()
                .providerShipmentId(mockShipmentId)
                .awbCode(mockAwb)
                .courierName("Delhivery Express (Mock)")
                .courierId("DELHIVERY_MOCK")
                .status("PICKUP_SCHEDULED")
                .message("Mock development shipment created successfully")
                .build();
    }

    @Override
    public TrackingResult trackShipment(String awbCode, String providerShipmentId) {
        log.info("Fetching mock tracking for AWB: {}", awbCode);
        return TrackingResult.builder()
                .awbCode(awbCode != null ? awbCode : "MOCK-AWB")
                .currentStatus("IN_TRANSIT")
                .location("Development Mock Hub, Pune")
                .activity("Package arrived at mock testing facility")
                .timestamp(java.time.ZonedDateTime.now().toString())
                .rawResponseJson("{\"status\":\"IN_TRANSIT\",\"mode\":\"MOCK\"}")
                .build();
    }

    @Override
    public CancelShipmentResult cancelShipment(String providerShipmentId, String awbCode) {
        log.info("Cancelling mock shipment ID: {}", providerShipmentId);
        return CancelShipmentResult.builder()
                .isCancelled(true)
                .message("Shipment cancelled successfully in mock mode")
                .build();
    }

    @Override
    public String generateLabel(String providerShipmentId, String awbCode) {
        return "https://shiprocket.co/label/mock/" + (awbCode != null ? awbCode : providerShipmentId);
    }

    @Override
    public boolean isMockMode() {
        return true;
    }
}

