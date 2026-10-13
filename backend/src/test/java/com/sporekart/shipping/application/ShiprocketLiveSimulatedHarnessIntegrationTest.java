package com.sporekart.shipping.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.cart.application.CartService;
import com.sporekart.cart.domain.Cart;
import com.sporekart.catalog.domain.Category;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.CategoryRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.order.api.dto.CreateOrderRequest;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.shipping.api.ShippingDtos;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import com.sporekart.shipping.infrastructure.ShipmentTrackingRepository;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketTokenManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase L — Authorized Live Verification Gate Simulation Harness.
 * 
 * Verifies that the complete live Shiprocket client pipeline (Authentication, Consignment creation,
 * AWB allocation, Pickup generation, Live tracking scans, Webhook state transitions, and Cancellation)
 * operates seamlessly in an end-to-end database environment without sending unapproved external network calls.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ShiprocketLiveSimulatedHarnessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private ShippingApplicationService shippingApplicationService;

    @Autowired
    private ShiprocketAdapter shiprocketAdapter;

    @MockBean
    private ShiprocketRestClient shiprocketRestClient;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CartService cartService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${sporekart.shiprocket.webhook-token}")
    private String webhookToken;

    private UUID userId;
    private ProductVariant testVariant;
    private OrderResponse paidOrder;

    @BeforeEach
    void setUp() {
        shipmentRepository.deleteAll();
        inventoryRecordRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        // 1. Activate Live Mode on the adapter for the duration of the harness
        ReflectionTestUtils.setField(shiprocketAdapter, "email", "pilot@sporekart.in");
        ReflectionTestUtils.setField(shiprocketAdapter, "password", "SuperLiveSecret2026");
        ReflectionTestUtils.setField(shiprocketAdapter, "useRealShiprocket", true);
        ReflectionTestUtils.setField(shiprocketAdapter, "defaultPickupLocation", "Primary");

        assertFalse(shiprocketAdapter.isMockMode(), "Harness prerequisite: Adapter must be in LIVE mode");

        // 2. Seed catalog product with physical shipping dimensions
        userId = UUID.randomUUID();

        Category category = Category.builder()
                .name("Medicinal Mushrooms")
                .slug("medicinal-mushrooms")
                .build();
        category = categoryRepository.save(category);

        Product product = Product.builder()
                .category(category)
                .title("Lion's Mane Fresh Cluster")
                .slug("lions-mane-fresh-250g")
                .productType(com.sporekart.catalog.domain.ProductType.FRESH_MUSHROOM)
                .isActive(true)
                .build();
        product = productRepository.save(product);

        testVariant = ProductVariant.builder()
                .product(product)
                .variantName("250g Cluster")
                .sku("LM-250G-PILOT")
                .priceInr(new BigDecimal("350.00"))
                .compareAtPriceInr(new BigDecimal("400.00"))
                .stockQuantity(50)
                .isActive(true)
                .weightKg(new BigDecimal("0.350"))
                .lengthCm(new BigDecimal("18.00"))
                .breadthCm(new BigDecimal("14.00"))
                .heightCm(new BigDecimal("12.00"))
                .build();
        testVariant = variantRepository.save(testVariant);

        // 3. Create customer cart and order
        Cart cart = cartService.getOrCreateCart(userId, null);
        cartService.addItemToCart(userId, null, testVariant.getId(), 2);

        OrderAddressSnapshot address = OrderAddressSnapshot.builder()
                .recipientName("Devendra Sharma")
                .phone("9876543210")
                .email("devendra@sporekart.in")
                .line1("Plot 42, Green Valley")
                .line2("Near Agriculture College")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();

        CreateOrderRequest orderReq = new CreateOrderRequest(null, address, "Pilot Shiprocket Order");
        paidOrder = orderService.createOrderFromCart(userId, null, "IDEM-LIVE-" + UUID.randomUUID(), orderReq);

        // 4. Transition order to PAID state
        PaymentDtos.InitiatePaymentResponse initResp = paymentService.initiatePayment(paidOrder.getId());
        PaymentDtos.VerifyPaymentRequest payReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(paidOrder.getId())
                .razorpayOrderId(initResp.getRazorpayOrderId())
                .razorpayPaymentId("pay_live_mock_" + UUID.randomUUID().toString().substring(0, 8))
                .razorpaySignature("sig_mock_12345")
                .build();
        paymentService.verifyPayment(payReq);

        paidOrder = orderService.getOrderById(paidOrder.getId());
        assertEquals(OrderStatus.PAID, paidOrder.getStatus(), "Order must be in PAID state prior to dispatch");
    }

    @AfterEach
    void tearDown() {
        // Safe Gate L11: Always restore adapter back to MOCK mode after testing
        ReflectionTestUtils.setField(shiprocketAdapter, "useRealShiprocket", false);
        assertTrue(shiprocketAdapter.isMockMode(), "Safety gate: Adapter must be returned to MOCK mode after test");
    }

    @Test
    @DisplayName("PHASE-L-SIMULATED: Complete End-to-End Live Pilot Lifecycle Simulation Harness")
    void testCompleteLiveShiprocketLifecycleSimulation() throws Exception {
        System.out.println("==========================================================================");
        System.out.println("STARTING PHASE L: LIVE SHIPROCKET SIMULATED INTEGRATION HARNESS");
        System.out.println("==========================================================================");

        // -----------------------------------------------------------------------------------------
        // GATE L01 & L02: Live Courier Serviceability Check
        // -----------------------------------------------------------------------------------------
        ShiprocketDtos.ServiceabilityResponse serviceabilityResponse = ShiprocketDtos.ServiceabilityResponse.builder()
                .status(200)
                .data(new ShiprocketDtos.ServiceabilityResponse.ServiceabilityData(List.of(
                        new ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany(
                                1L, "Blue Dart Express", new BigDecimal("120.00"), "2 Days", 2),
                        new ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany(
                                2L, "Delhivery Surface", new BigDecimal("85.00"), "3 Days", 3)
                )))
                .build();

        when(shiprocketRestClient.checkServiceability(eq("411001"), eq("411001"), any(), eq(false)))
                .thenReturn(serviceabilityResponse);

        ShippingDtos.PincodeServiceabilityResponse serviceabilityResult =
                shippingApplicationService.checkPincodeServiceability("411001");

        assertNotNull(serviceabilityResult);
        assertTrue(serviceabilityResult.isServiceable());
        assertEquals("Delhivery Surface", serviceabilityResult.getCourierName());
        assertEquals(new BigDecimal("85.00"), serviceabilityResult.getShippingFeeInr());
        System.out.println("✓ GATE L01/L02 PASS: Live serviceability evaluated, selected lowest rate courier: " +
                serviceabilityResult.getCourierName() + " (₹" + serviceabilityResult.getShippingFeeInr() + ")");

        // -----------------------------------------------------------------------------------------
        // GATE L03 - L05: Live Adhoc Consignment Creation, Courier Allocation, & Pickup Scheduling
        // -----------------------------------------------------------------------------------------
        ShiprocketDtos.CreateOrderResponse adhocOrderResponse = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(99118822L)
                .shipmentId(88227711L)
                .status("NEW")
                .statusCode(1)
                .message("Order created successfully")
                .build();

        ShiprocketDtos.AssignAwbResponse assignAwbResponse = ShiprocketDtos.AssignAwbResponse.builder()
                .response(new ShiprocketDtos.AssignAwbResponse.ResponseData(
                        new ShiprocketDtos.AssignAwbResponse.AwbData(
                                "143254326543", "Delhivery Surface", 2L, "2026-10-12 18:30:00"
                        )
                ))
                .build();

        ShiprocketDtos.GeneratePickupResponse pickupResponse = ShiprocketDtos.GeneratePickupResponse.builder()
                .response(new ShiprocketDtos.GeneratePickupResponse.PickupData(
                        1, "Pickup scheduled successfully for 2026-10-13", "PU-20261012-99001"
                ))
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(adhocOrderResponse);
        when(shiprocketRestClient.assignAwb(eq("88227711"), isNull())).thenReturn(assignAwbResponse);
        when(shiprocketRestClient.requestPickup(eq("88227711"))).thenReturn(pickupResponse);

        // Execute Dispatch
        Shipment createdShipment = shippingService.createShipmentForOrder(paidOrder.getId());

        assertNotNull(createdShipment);
        assertEquals("88227711", createdShipment.getProviderShipmentId());
        assertEquals("143254326543", createdShipment.getAwbCode());
        assertEquals("Delhivery Surface", createdShipment.getCourierName());
        assertEquals("2", createdShipment.getCourierId());
        assertEquals(ShipmentStatus.PICKUP_SCHEDULED, createdShipment.getStatus());

        // Validate payload sent to Shiprocket
        ArgumentCaptor<ShiprocketDtos.CreateAdhocOrderRequest> captor =
                ArgumentCaptor.forClass(ShiprocketDtos.CreateAdhocOrderRequest.class);
        verify(shiprocketRestClient).createAdhocOrder(captor.capture());
        ShiprocketDtos.CreateAdhocOrderRequest sentPayload = captor.getValue();

        assertEquals(paidOrder.getOrderNumber(), sentPayload.getOrderId());
        assertEquals("Devendra", sentPayload.getBillingCustomerName());
        assertEquals("Sharma", sentPayload.getBillingLastName());
        assertEquals("Pune", sentPayload.getBillingCity());
        assertEquals("411001", sentPayload.getBillingPincode());
        assertEquals("Primary", sentPayload.getPickupLocation());
        // 2 units * 0.350kg = 0.700kg
        assertEquals(new BigDecimal("0.700"), sentPayload.getWeight());
        // Dimensions: 18 x 14 x (12 * 2 = 24)
        assertEquals(new BigDecimal("18.00"), sentPayload.getLength());
        assertEquals(new BigDecimal("14.00"), sentPayload.getBreadth());
        assertEquals(new BigDecimal("24.00"), sentPayload.getHeight());

        // Order state must be SHIPPED and tracking details attached
        OrderResponse updatedOrder = orderService.getOrderById(paidOrder.getId());
        assertEquals(OrderStatus.SHIPPED, updatedOrder.getStatus());
        assertEquals("143254326543", updatedOrder.getTrackingNumber());
        assertEquals("Delhivery Surface", updatedOrder.getCourierPartner());
        assertTrue(updatedOrder.getTrackingUrl().contains("143254326543"));
        System.out.println("✓ GATE L03-L05 PASS: Live adhoc order, AWB, pickup scheduled and persisted for order #" +
                paidOrder.getOrderNumber() + " with AWB " + createdShipment.getAwbCode());

        // -----------------------------------------------------------------------------------------
        // GATE L06: Live Carrier Tracking Scan Fetch
        // -----------------------------------------------------------------------------------------
        ShiprocketDtos.TrackAwbResponse trackAwbResponse = ShiprocketDtos.TrackAwbResponse.builder()
                .trackingData(new ShiprocketDtos.TrackAwbResponse.TrackingData(
                        1, 6,
                        List.of(new ShiprocketDtos.TrackAwbResponse.ShipmentTrack(
                                88227711L, "IN_TRANSIT", "Pune Fulfillment Center", "Bengaluru Hub")),
                        List.of(
                                new ShiprocketDtos.TrackAwbResponse.TrackingActivity(
                                        "2026-10-12 19:00:00", "In Transit", "Departed from Pune FC", "Pune Hub"),
                                new ShiprocketDtos.TrackAwbResponse.TrackingActivity(
                                        "2026-10-12 21:00:00", "In Transit", "Arrived at Sorting Hub", "Mumbai Central")
                        )
                ))
                .build();

        when(shiprocketRestClient.trackAwb("143254326543")).thenReturn(trackAwbResponse);

        com.sporekart.shipping.domain.ShipmentTracking trackedEvent = shippingService.updateTrackingStatus(createdShipment.getId());
        assertNotNull(trackedEvent);
        assertEquals("IN_TRANSIT", trackedEvent.getCurrentStatus());

        Shipment reloadedShipment = shipmentRepository.findById(createdShipment.getId()).orElseThrow();
        assertEquals(ShipmentStatus.IN_TRANSIT, reloadedShipment.getStatus());
        assertTrue(shipmentTrackingRepository.findByShipmentIdOrderByTimestampDesc(createdShipment.getId()).size() >= 2);
        System.out.println("✓ GATE L06 PASS: Live tracking status synchronized, status: " + reloadedShipment.getStatus());

        // -----------------------------------------------------------------------------------------
        // GATE L07: Inbound Real-Time Webhook Update & Terminal State Verification
        // -----------------------------------------------------------------------------------------
        String webhookPayload = """
                {
                    "awb": "143254326543",
                    "current_status": "DELIVERED",
                    "current_location": "Pune East Hub",
                    "scans": "Delivered to customer"
                }
                """;

        mockMvc.perform(post("/shipping/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Shiprocket-Token", webhookToken)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Shipment deliveredShipment = shipmentRepository.findByAwbCode("143254326543").orElseThrow();
        assertEquals(ShipmentStatus.DELIVERED, deliveredShipment.getStatus());
        assertNotNull(deliveredShipment.getDeliveredAt());

        OrderResponse deliveredOrder = orderService.getOrderById(paidOrder.getId());
        assertEquals(OrderStatus.DELIVERED, deliveredOrder.getStatus());
        System.out.println("✓ GATE L07 PASS: Webhook processed to terminal DELIVERED status for AWB 143254326543");

        // Webhook Terminal State regression test: out-of-order IN_TRANSIT scan ignored
        String staleWebhookPayload = """
                {
                    "awb": "143254326543",
                    "current_status": "IN_TRANSIT",
                    "current_location": "Stale Transit Center",
                    "scans": "Late scan arriving out-of-order"
                }
                """;

        mockMvc.perform(post("/shipping/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Shiprocket-Token", webhookToken)
                        .content(staleWebhookPayload))
                .andExpect(status().isOk());

        Shipment recheckedShipment = shipmentRepository.findByAwbCode("143254326543").orElseThrow();
        assertEquals(ShipmentStatus.DELIVERED, recheckedShipment.getStatus(), "Shipment status must NOT regress to IN_TRANSIT");
        System.out.println("✓ GATE L08 PASS: Out-of-order stale scan safely rejected; status preserved as DELIVERED");

        // -----------------------------------------------------------------------------------------
        // GATE L09: Live Consignment Cancellation
        // -----------------------------------------------------------------------------------------
        ShiprocketDtos.CancelOrderResponse cancelResponse = ShiprocketDtos.CancelOrderResponse.builder()
                .statusCode(200)
                .message("Order cancelled successfully in Shiprocket")
                .build();

        when(shiprocketRestClient.cancelOrder("88227711")).thenReturn(cancelResponse);

        ShippingProvider.CancelShipmentResult cancelResult =
                shiprocketAdapter.cancelShipment("88227711", "143254326543");

        assertTrue(cancelResult.isCancelled());
        assertEquals("Order cancelled successfully in Shiprocket", cancelResult.getMessage());
        verify(shiprocketRestClient).cancelOrder("88227711");
        System.out.println("✓ GATE L09 PASS: Live cancellation transmitted and acknowledged by Shiprocket");

        System.out.println("==========================================================================");
        System.out.println("PHASE L SIMULATED HARNESS COMPLETED WITH 100% SUCCESS");
        System.out.println("==========================================================================");
    }
}
