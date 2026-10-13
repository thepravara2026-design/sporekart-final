package com.sporekart.shipping.application;

import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.application.NotificationEventService;
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
    @Mock
    private NotificationEventService notificationEventService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private com.sporekart.catalog.infrastructure.ProductVariantRepository variantRepository;

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

        OrderAddressSnapshot shippingAddr = OrderAddressSnapshot.builder()
                .recipientName("John Doe")
                .email("john@example.com")
                .phone("9876543210")
                .line1("123 Farm Rd")
                .line2("")
                .city("Pune")
                .state("MH")
                .pincode("411001")
                .build();

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
        testOrderResponse.setStatus(OrderStatus.PAID);
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

        org.springframework.test.util.ReflectionTestUtils.setField(shippingService, "trackingBaseUrl", "https://track.shiprocket.in/");
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

    @Test
    @DisplayName("SHP-6: Create shipment for unpaid order throws IllegalStateException")
    void SHP_6_createShipmentForOrder_unpaid_throws() {
        testOrderResponse.setStatus(OrderStatus.PENDING_PAYMENT);
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderService.getOrderById(orderId)).thenReturn(testOrderResponse);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> shippingService.createShipmentForOrder(orderId));
        assertTrue(ex.getMessage().contains("Order must be PAID or CONFIRMED"));
    }

    @Test
    @DisplayName("SHP-7: Create shipment for cancelled order throws IllegalStateException")
    void SHP_7_createShipmentForOrder_cancelled_throws() {
        testOrderResponse.setStatus(OrderStatus.CANCELLED);
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderService.getOrderById(orderId)).thenReturn(testOrderResponse);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> shippingService.createShipmentForOrder(orderId));
        assertTrue(ex.getMessage().contains("Cannot create courier shipment for a cancelled or refunded order"));
    }

    @Test
    @DisplayName("SHP-8: Webhook update ignores in-transit scans for already DELIVERED shipments")
    void SHP_8_processWebhookUpdate_delivered_no_regression() {
        testShipment.setStatus(ShipmentStatus.DELIVERED);
        when(shipmentRepository.findByAwbCode("AWB123456")).thenReturn(Optional.of(testShipment));

        shippingService.processWebhookUpdate("AWB123456", "IN_TRANSIT", "Pune Hub", "Package scanned in transit", "{}");

        assertEquals(ShipmentStatus.DELIVERED, testShipment.getStatus());
        verify(orderService, never()).updateOrderStatus(any(), eq(OrderStatus.SHIPPED), any(), any());
    }

    @Test
    @DisplayName("SHP-9: Package dead weight and dimensions calculated from product variants")
    void SHP_9_createShipment_calculatesPackageWeightAndDimensions() {
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderService.getOrderById(orderId)).thenReturn(testOrderResponse);

        UUID variantId = UUID.randomUUID();
        com.sporekart.order.api.dto.OrderItemResponse itemWithVariant = new com.sporekart.order.api.dto.OrderItemResponse();
        itemWithVariant.setVariantId(variantId);
        itemWithVariant.setProductTitle("Oyster Mushroom Spawn");
        itemWithVariant.setSku("SPAWN-OYSTER-1KG");
        itemWithVariant.setQuantity(2);
        itemWithVariant.setPriceInr(new BigDecimal("500.00"));
        testOrderResponse.setItems(List.of(itemWithVariant));

        com.sporekart.catalog.domain.ProductVariant variant = com.sporekart.catalog.domain.ProductVariant.builder()
                .id(variantId)
                .sku("SPAWN-OYSTER-1KG")
                .weightKg(new BigDecimal("0.750"))
                .lengthCm(new BigDecimal("20.00"))
                .breadthCm(new BigDecimal("20.00"))
                .heightCm(new BigDecimal("12.00"))
                .build();
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));

        when(shippingProvider.createShipment(any())).thenAnswer(invocation -> {
            ShippingProvider.CreateShipmentCommand cmd = invocation.getArgument(0);
            // 2 items * 0.750kg = 1.500kg
            assertEquals(new BigDecimal("1.500"), cmd.getWeightKg());
            assertEquals(new BigDecimal("20.00"), cmd.getLengthCm());
            assertEquals(new BigDecimal("20.00"), cmd.getBreadthCm());
            // 2 items * 12cm = 24cm
            assertEquals(new BigDecimal("24.00"), cmd.getHeightCm());
            assertEquals("Primary", cmd.getPickupLocation());
            assertEquals("411001", cmd.getPickupPincode());

            return ShippingProvider.CreateShipmentResult.builder()
                    .providerShipmentId("SR-999")
                    .awbCode("AWB-999")
                    .courierName("Delhivery")
                    .build();
        });
        when(shipmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Shipment created = shippingService.createShipmentForOrder(orderId);
        assertNotNull(created);
        verify(shippingProvider).createShipment(any());
    }

    @Test
    @DisplayName("SHP-10: Webhook update deduplicates identical tracking scans")
    void SHP_10_processWebhookUpdate_deduplicatesIdenticalScans() {
        when(shipmentRepository.findByAwbCode("AWB123456")).thenReturn(Optional.of(testShipment));

        // First webhook scan
        shippingService.processWebhookUpdate("AWB123456", "IN_TRANSIT", "Pune Hub", "Scanned in Pune", "{}");
        assertEquals(1, testShipment.getTrackingEvents().size());
        verify(shipmentRepository, times(1)).save(testShipment);

        // Second identical webhook scan
        shippingService.processWebhookUpdate("AWB123456", "IN_TRANSIT", "Pune Hub", "Scanned in Pune", "{}");
        // Must remain 1 event, must not save again
        assertEquals(1, testShipment.getTrackingEvents().size());
        verify(shipmentRepository, times(1)).save(testShipment);
    }

    @Test
    @DisplayName("SHP-11: Custom tracking base URL is reflected when updating order shipping details")
    void SHP_11_customTrackingBaseUrl_isUsed() {
        org.springframework.test.util.ReflectionTestUtils.setField(shippingService, "trackingBaseUrl", "https://custom-tracking.sporekart.in/");
        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderService.getOrderById(orderId)).thenReturn(testOrderResponse);

        ShippingProvider.CreateShipmentResult providerResult = ShippingProvider.CreateShipmentResult.builder()
                .providerShipmentId("SR-SHIP-999")
                .awbCode("AWB-CUSTOM-123")
                .courierName("BlueDart")
                .courierId("1")
                .status("PICKUP_SCHEDULED")
                .build();
        when(shippingProvider.createShipment(any())).thenReturn(providerResult);
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(i -> i.getArgument(0));

        shippingService.createShipmentForOrder(orderId);

        verify(orderService).updateOrderShippingDetails(
                eq(orderId),
                eq("BlueDart"),
                eq("AWB-CUSTOM-123"),
                eq("https://custom-tracking.sporekart.in/AWB-CUSTOM-123")
        );
    }
}

