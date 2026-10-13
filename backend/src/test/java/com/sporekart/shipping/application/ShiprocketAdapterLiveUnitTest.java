package com.sporekart.shipping.application;

import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiprocketAdapterLiveUnitTest {

    @Mock
    private ShiprocketRestClient shiprocketRestClient;

    private ShiprocketAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new ShiprocketAdapter(shiprocketRestClient);
        ReflectionTestUtils.setField(adapter, "email", "live@sporekart.in");
        ReflectionTestUtils.setField(adapter, "password", "live_password_123");
        ReflectionTestUtils.setField(adapter, "useRealShiprocket", true);
        ReflectionTestUtils.setField(adapter, "defaultPickupLocation", "Primary");
    }

    @Test
    @DisplayName("ADAPT-LIVE-1: Live createShipment invokes adhoc order creation, AWB assignment, and pickup")
    void ADAPT_LIVE_1_createShipment_invokesLiveClient() {
        ShiprocketDtos.CreateOrderResponse createOrderResponse = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(887766L)
                .shipmentId(998877L)
                .status("NEW")
                .statusCode(1)
                .build();

        ShiprocketDtos.AssignAwbResponse assignAwbResponse = ShiprocketDtos.AssignAwbResponse.builder()
                .response(new ShiprocketDtos.AssignAwbResponse.ResponseData(
                        new ShiprocketDtos.AssignAwbResponse.AwbData(
                                "143254326543", "Delhivery Surface", 1L, "2026-10-12 18:05:00"
                        )
                ))
                .build();

        ShiprocketDtos.GeneratePickupResponse pickupResponse = ShiprocketDtos.GeneratePickupResponse.builder()
                .response(new ShiprocketDtos.GeneratePickupResponse.PickupData(1, "Scheduled", "PU-12345"))
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(createOrderResponse);
        when(shiprocketRestClient.assignAwb(eq("998877"), any())).thenReturn(assignAwbResponse);
        when(shiprocketRestClient.requestPickup(eq("998877"))).thenReturn(pickupResponse);

        ShippingProvider.CreateShipmentCommand command = ShippingProvider.CreateShipmentCommand.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("SK-2026-0099")
                .recipientName("Ramesh Patil")
                .phone("9876543210")
                .email("ramesh@sporekart.in")
                .addressLine1("Farm 101")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .totalAmountInr(new BigDecimal("500.00"))
                .weightKg(new BigDecimal("0.75"))
                .lengthCm(new BigDecimal("20.00"))
                .breadthCm(new BigDecimal("15.00"))
                .heightCm(new BigDecimal("10.00"))
                .pickupLocation("Primary")
                .items(List.of(
                        ShippingProvider.ShipmentItemCommand.builder()
                                .title("Oyster Mushroom Spawn")
                                .sku("SPWN-OYST-1KG")
                                .quantity(1)
                                .priceInr(new BigDecimal("500.00"))
                                .build()
                ))
                .build();

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(command);

        assertNotNull(result);
        assertEquals("998877", result.getProviderShipmentId());
        assertEquals("143254326543", result.getAwbCode());
        assertEquals("Delhivery Surface", result.getCourierName());
        assertEquals("1", result.getCourierId());
        assertEquals("PICKUP_SCHEDULED", result.getStatus());

        ArgumentCaptor<ShiprocketDtos.CreateAdhocOrderRequest> captor = ArgumentCaptor.forClass(ShiprocketDtos.CreateAdhocOrderRequest.class);
        verify(shiprocketRestClient).createAdhocOrder(captor.capture());
        ShiprocketDtos.CreateAdhocOrderRequest captured = captor.getValue();
        assertEquals("SK-2026-0099", captured.getOrderId());
        assertEquals("Ramesh", captured.getBillingCustomerName());
        assertEquals("Patil", captured.getBillingLastName());
        assertEquals(new BigDecimal("0.75"), captured.getWeight());
        assertEquals(new BigDecimal("20.00"), captured.getLength());
        verify(shiprocketRestClient).assignAwb("998877", null);
        verify(shiprocketRestClient).requestPickup("998877");
    }

    @Test
    @DisplayName("ADAPT-LIVE-2: Live trackShipment queries real Shiprocket tracking status")
    void ADAPT_LIVE_2_trackShipment_invokesLiveClient() {
        ShiprocketDtos.TrackAwbResponse trackResponse = ShiprocketDtos.TrackAwbResponse.builder()
                .trackingData(new ShiprocketDtos.TrackAwbResponse.TrackingData(
                        1, 6,
                        List.of(new ShiprocketDtos.TrackAwbResponse.ShipmentTrack(998877L, "IN_TRANSIT", "Pune", "Bengaluru")),
                        List.of(new ShiprocketDtos.TrackAwbResponse.TrackingActivity("2026-10-12 14:00:00", "In Transit", "Arrived at Hub", "Mumbai Central"))
                ))
                .build();

        when(shiprocketRestClient.trackAwb("143254326543")).thenReturn(trackResponse);

        ShippingProvider.TrackingResult result = adapter.trackShipment("143254326543", "998877");

        assertNotNull(result);
        assertEquals("143254326543", result.getAwbCode());
        assertEquals("IN_TRANSIT", result.getCurrentStatus());
        assertEquals("Mumbai Central", result.getLocation());
        assertEquals("Arrived at Hub", result.getActivity());
        assertEquals("2026-10-12 14:00:00", result.getTimestamp());
        verify(shiprocketRestClient).trackAwb("143254326543");
    }

    @Test
    @DisplayName("ADAPT-LIVE-3: Live cancelShipment sends cancellation to Shiprocket")
    void ADAPT_LIVE_3_cancelShipment_invokesLiveClient() {
        ShiprocketDtos.CancelOrderResponse cancelResponse = ShiprocketDtos.CancelOrderResponse.builder()
                .statusCode(200)
                .message("Order cancelled successfully")
                .build();

        when(shiprocketRestClient.cancelOrder("998877")).thenReturn(cancelResponse);

        ShippingProvider.CancelShipmentResult result = adapter.cancelShipment("998877", "143254326543");

        assertNotNull(result);
        assertTrue(result.isCancelled());
        assertEquals("Order cancelled successfully", result.getMessage());
        verify(shiprocketRestClient).cancelOrder("998877");
    }

    @Test
    @DisplayName("ADAPT-LIVE-4: AWB assignment fallback uses shipment reference if carrier fails to assign AWB immediately")
    void ADAPT_LIVE_4_fallbackToShipmentRef_whenAwbFails() {
        ShiprocketDtos.CreateOrderResponse createOrderResponse = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(887766L)
                .shipmentId(998877L)
                .status("NEW")
                .statusCode(1)
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(createOrderResponse);
        when(shiprocketRestClient.assignAwb(eq("998877"), any())).thenThrow(new RuntimeException("Carrier temporary timeout"));

        ShippingProvider.CreateShipmentCommand command = ShippingProvider.CreateShipmentCommand.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("SK-2026-0099")
                .recipientName("Ramesh")
                .phone("9876543210")
                .addressLine1("Farm 101")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .totalAmountInr(new BigDecimal("500.00"))
                .build();

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(command);

        assertNotNull(result);
        assertEquals("998877", result.getProviderShipmentId());
        assertEquals("SR-998877", result.getAwbCode());
        assertEquals("PICKUP_SCHEDULED", result.getStatus());
    }
}
