package com.sporekart.shipping.application;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingServiceUnitTest {

    @Mock
    private ShipmentRepository shipmentRepository;
    @Mock
    private ShipmentTrackingRepository trackingRepository;
    @Mock
    private ShippingProvider shippingProvider;
    @Mock
    private OrderService orderService;

    @InjectMocks
    private ShippingService shippingService;

    private UUID orderId;
    private UUID shipmentId;
    private Shipment testShipment;
    private OrderResponse testOrderResponse;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        shipmentId = UUID.randomUUID();

        OrderAddressSnapshot shippingAddr = new OrderAddressSnapshot(
                "John Doe", "9876543210", "123 Farm Rd", "", "Pune", "MH", "411001"
        );

        OrderItemResponse item = new OrderItemResponse();
        item.setProductTitle("Oyster Mushroom");
        item.setSku("SKU-123");
        item.setQuantity(2);
        item.setPriceInr(new BigDecimal("100.00"));

        testOrderResponse = new OrderResponse();
        testOrderResponse.setId(orderId);
        testOrderResponse.setOrderNumber("ORD-20260926-001");
        testOrderResponse.setShippingAddress(shippingAddr);
        testOrderResponse.setTotalAmountInr(new BigDecimal("200.00"));
        testOrderResponse.setItems(List.of(item));

        testShipment = Shipment.builder()
                .id(shipmentId)
                .orderId(orderId)
                .orderNumber("ORD-20260926-001")
                .providerShipmentId("SR-SHIP-123")
                .awbCode("AWB123456")
                .courierName("Delhivery")
                .status(ShipmentStatus.PICKUP_SCHEDULED)
                .build();
    }

    @Test
    @DisplayName("SHP-1: Create shipment for order creates provider shipment and updates order status")
    void SHP_1_createShipmentForOrder_success() {
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderService.getOrderById(orderId)).thenReturn(testOrderResponse);

        ShippingProvider.CreateShipmentResult providerResult = ShippingProvider.CreateShipmentResult.builder()
                .providerShipmentId("SR-SHIP-123")
                .awbCode("AWB123456")
                .courierName("Delhivery")
                .courierId("1")
                .message("Pickup scheduled successfully")
                .build();
        when(shippingProvider.createShipment(any())).thenReturn(providerResult);
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(i -> i.getArgument(0));

        Shipment shipment = shippingService.createShipmentForOrder(orderId);

        assertNotNull(shipment);
        assertEquals("AWB123456", shipment.getAwbCode());
        assertEquals(ShipmentStatus.PICKUP_SCHEDULED, shipment.getStatus());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.SHIPPED), anyString(), anyString());
    }

    @Test
    @DisplayName("SHP-2: Create shipment returns existing shipment if already created")
    void SHP_2_createShipmentForOrder_returnsExisting() {
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.of(testShipment));

        Shipment shipment = shippingService.createShipmentForOrder(orderId);

        assertEquals(testShipment, shipment);
        verify(shippingProvider, never()).createShipment(any());
    }

    @Test
    @DisplayName("SHP-3: Update tracking status updates shipment and order status to DELIVERED when delivered")
    void SHP_3_updateTrackingStatus_delivered() {
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(testShipment));

        ShippingProvider.TrackingResult trackingResult = ShippingProvider.TrackingResult.builder()
                .awbCode("AWB123456")
                .currentStatus("DELIVERED")
                .location("Pune Hub")
                .activity("Package delivered to customer")
                .build();
        when(shippingProvider.trackShipment("AWB123456", "SR-SHIP-123")).thenReturn(trackingResult);

        ShipmentTracking tracking = shippingService.updateTrackingStatus(shipmentId);

        assertNotNull(tracking);
        assertEquals(ShipmentStatus.DELIVERED, testShipment.getStatus());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.DELIVERED), anyString(), anyString());
        verify(shipmentRepository).save(testShipment);
    }

    @Test
    @DisplayName("SHP-4: Process webhook update updates shipment and order status upon delivery notification")
    void SHP_4_processWebhookUpdate_delivered() {
        when(shipmentRepository.findByAwbCode("AWB123456")).thenReturn(Optional.of(testShipment));

        shippingService.processWebhookUpdate("AWB123456", "DELIVERED", "Pune Hub", "Delivered", "{ \"event\": \"DELIVERED\" }");

        assertEquals(ShipmentStatus.DELIVERED, testShipment.getStatus());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.DELIVERED), anyString(), eq("SHIPROCKET_WEBHOOK"));
        verify(shipmentRepository).save(testShipment);
    }

    @Test
    @DisplayName("SHP-5: Cancel shipment invokes shipping provider and sets CANCELLED status")
    void SHP_5_cancelShipment_success() {
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(testShipment));

        shippingService.cancelShipment(shipmentId, "Customer requested cancellation");

        assertEquals(ShipmentStatus.CANCELLED, testShipment.getStatus());
        verify(shippingProvider).cancelShipment("SR-SHIP-123", "AWB123456");
        verify(shipmentRepository).save(testShipment);
    }
}
