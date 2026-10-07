package com.sporekart.notification;

import com.sporekart.cart.application.CartService;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductOfferRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.application.NotificationWorker;
import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.notification.domain.NotificationStatus;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import com.sporekart.order.api.dto.CreateOrderRequest;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import com.sporekart.shipping.infrastructure.ShipmentTrackingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class OrderNotificationSmokeTest {

    private static final String TARGET_EMAIL = "thepravara2026@gmail.com";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderEventRepository orderEventRepository;

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private ShipmentTrackingRepository trackingRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private AdminCatalogService adminCatalogService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductOfferRepository offerRepository;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private NotificationEventRepository notificationRepository;

    @Autowired
    private NotificationWorker notificationWorker;

    private User testUser;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        shipmentRepository.deleteAll();
        orderEventRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        offerRepository.deleteAll();
        inventoryRecordRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();

        String uniquePhone = "9" + String.format("%09d", Math.abs(UUID.randomUUID().getLeastSignificantBits() % 1_000_000_000L));

        // 1. Create or fetch target test user (thepravara2026@gmail.com)
        testUser = userRepository.findByEmail(TARGET_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .firstName("Pravara")
                        .lastName("Grower")
                        .fullName("Pravara Grower")
                        .email(TARGET_EMAIL)
                        .phone(uniquePhone)
                        .role(UserRole.ROLE_CUSTOMER)
                        .isVerified(true)
                        .isEmailVerified(true)
                        .build()));

        // 2. Setup Catalog Product & Stock
        String unique = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(
                null, "Fresh Pink Oyster Mushroom " + unique, "pink-oyster-" + unique,
                "Cultivated Fresh Mushroom", com.sporekart.catalog.domain.ProductType.FRESH_MUSHROOM, com.sporekart.catalog.domain.ProductStatus.ACTIVE,
                "0709", new BigDecimal("5.00"), "Meta", "Desc", "url", true
        );
        Product testProduct = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest varReq = new CatalogDtos.CreateVariantRequest(
                "500g", "SKU-PINK-" + unique, new BigDecimal("299.00"),
                new BigDecimal("350.00"), 100, true
        );
        testVariant = adminCatalogService.addVariant(testProduct.getId(), varReq);
    }

    @Test
    @DisplayName("Smoke Test: Complete Order Lifecycle Email Notification Routing")
    void testCompleteOrderLifecycleNotificationRouting() throws Exception {
        System.out.println("==========================================================================");
        System.out.println("STARTING ORDER LIFECYCLE EMAIL NOTIFICATION SMOKE TEST FOR: " + TARGET_EMAIL);
        System.out.println("==========================================================================");

        // --- STEP 1: ORDER CONFIRMATION ---
        cartService.addItemToCart(testUser.getId(), null, testVariant.getId(), 2);

        OrderAddressSnapshot address = OrderAddressSnapshot.builder()
                .recipientName("Pravara Grower")
                .email(TARGET_EMAIL)
                .phone(testUser.getPhone())
                .line1("Plot 42, AgTech Park")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();

        CreateOrderRequest req1 = new CreateOrderRequest(null, address, "Test Order 1");
        OrderResponse order1Resp = orderService.createOrderFromCart(testUser.getId(), null, "idemp-smoke-1", req1);

        assertNotNull(order1Resp);
        assertNotNull(order1Resp.getId());

        // Pause briefly to let async @TransactionalEventListener process after transaction commit
        Thread.sleep(800);

        // Verify ORDER_CONFIRMED event recorded
        List<NotificationEvent> orderConfirmedEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.ORDER_CONFIRMED)
                .toList();

        assertFalse(orderConfirmedEvents.isEmpty(), "ORDER_CONFIRMED event should be recorded");
        assertEquals(TARGET_EMAIL, orderConfirmedEvents.get(0).getRecipientEmail(), "Recipient email must be " + TARGET_EMAIL);
        System.out.println("✓ STEP 1 SUCCESS: ORDER_CONFIRMED event recorded for " + TARGET_EMAIL + " (Event ID: " + orderConfirmedEvents.get(0).getId() + ")");

        // --- STEP 2: ORDER PROCESSING / PACKED ---
        orderService.updateOrderStatus(order1Resp.getId(), OrderStatus.PROCESSING, "Order packed at warehouse", "WAREHOUSE_ADMIN");
        Thread.sleep(400);

        List<NotificationEvent> orderPackedEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.ORDER_PACKED)
                .toList();

        assertFalse(orderPackedEvents.isEmpty(), "ORDER_PACKED event should be recorded");
        assertEquals(TARGET_EMAIL, orderPackedEvents.get(0).getRecipientEmail());
        System.out.println("✓ STEP 2 SUCCESS: ORDER_PACKED event recorded for " + TARGET_EMAIL + " (Event ID: " + orderPackedEvents.get(0).getId() + ")");

        // --- STEP 3: SHIPMENT CREATED (SHIPMENT_SHIPPED) ---
        Shipment shipment = shippingService.createShipmentForOrder(order1Resp.getId());
        Thread.sleep(400);

        assertNotNull(shipment);
        assertNotNull(shipment.getAwbCode());

        List<NotificationEvent> shipmentShippedEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.SHIPMENT_SHIPPED)
                .toList();

        assertFalse(shipmentShippedEvents.isEmpty(), "SHIPMENT_SHIPPED event should be recorded");
        assertEquals(TARGET_EMAIL, shipmentShippedEvents.get(0).getRecipientEmail());
        System.out.println("✓ STEP 3 SUCCESS: SHIPMENT_SHIPPED event recorded for " + TARGET_EMAIL + " (AWB: " + shipment.getAwbCode() + ")");

        // --- STEP 4: SHIPMENT IN TRANSIT ---
        shippingService.updateTrackingStatus(shipment.getId());
        Thread.sleep(400);

        List<NotificationEvent> shipmentInTransitEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.SHIPMENT_IN_TRANSIT)
                .toList();

        System.out.println("✓ STEP 4 PROCESSED: Tracking status updated for shipment AWB: " + shipment.getAwbCode());

        // --- STEP 5: ORDER DELIVERED ---
        orderService.updateOrderStatus(order1Resp.getId(), OrderStatus.DELIVERED, "Package delivered to customer", "COURIER_PARTNER");
        Thread.sleep(800);

        List<NotificationEvent> orderDeliveredEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.ORDER_DELIVERED)
                .toList();

        assertFalse(orderDeliveredEvents.isEmpty(), "ORDER_DELIVERED event should be recorded");
        assertEquals(TARGET_EMAIL, orderDeliveredEvents.get(0).getRecipientEmail());
        System.out.println("✓ STEP 5 SUCCESS: ORDER_DELIVERED event recorded for " + TARGET_EMAIL);

        // --- STEP 6: ORDER CANCELLATION & REFUND ---
        cartService.addItemToCart(testUser.getId(), null, testVariant.getId(), 1);
        CreateOrderRequest req2 = new CreateOrderRequest(null, address, "Test Order 2");
        OrderResponse order2Resp = orderService.createOrderFromCart(testUser.getId(), null, "idemp-smoke-2", req2);

        orderService.cancelOrder(order2Resp.getId(), testUser.getId(), "Customer requested cancellation");
        Thread.sleep(400);

        List<NotificationEvent> orderCancelledEvents = notificationRepository.findAll().stream()
                .filter(e -> e.getEventType() == NotificationEventType.ORDER_CANCELLED)
                .toList();

        assertFalse(orderCancelledEvents.isEmpty(), "ORDER_CANCELLED event should be recorded");
        assertEquals(TARGET_EMAIL, orderCancelledEvents.get(0).getRecipientEmail());
        System.out.println("✓ STEP 6 SUCCESS: ORDER_CANCELLED event recorded for " + TARGET_EMAIL);

        // --- STEP 7: DISPATCH QUEUE EXECUTION ---
        System.out.println("--------------------------------------------------------------------------");
        System.out.println("EXECUTING NOTIFICATION WORKER OUTBOX DISPATCH...");
        System.out.println("--------------------------------------------------------------------------");

        notificationWorker.processOutboxQueue();

        List<NotificationEvent> allEvents = notificationRepository.findAll();
        long sentCount = allEvents.stream().filter(e -> e.getStatus() == NotificationStatus.SENT).count();
        long failedCount = allEvents.stream().filter(e -> e.getStatus() == NotificationStatus.FAILED).count();
        long pendingCount = allEvents.stream().filter(e -> e.getStatus() == NotificationStatus.PENDING || e.getStatus() == NotificationStatus.RETRY_SCHEDULED).count();

        System.out.println("OUTBOX DISPATCH RESULTS SUMMARY:");
        System.out.println("Total Events Recorded : " + allEvents.size());
        System.out.println("Events Marked SENT    : " + sentCount);
        System.out.println("Events Marked FAILED  : " + failedCount);
        System.out.println("Events Pending/Retry  : " + pendingCount);

        for (NotificationEvent event : allEvents) {
            System.out.println("  -> Event [" + event.getEventType() + "] ID: " + event.getId() + " | Status: " + event.getStatus() + " | Recipient: " + event.getRecipientEmail() + " | Error: " + event.getErrorMessage());
            assertEquals(TARGET_EMAIL, event.getRecipientEmail(), "Every notification event recipient must strictly match target email");
            assertEquals(NotificationStatus.SENT, event.getStatus(), "Notification event must be processed to SENT status");
        }

        System.out.println("==========================================================================");
        System.out.println("ALL ORDER LIFECYCLE NOTIFICATIONS ROUTED PERFECTLY TO: " + TARGET_EMAIL);
        System.out.println("==========================================================================");
    }
}
