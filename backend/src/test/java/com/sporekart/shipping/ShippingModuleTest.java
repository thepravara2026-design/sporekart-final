package com.sporekart.shipping;

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
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import com.sporekart.shipping.domain.ShipmentTracking;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ShippingModuleTest {

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private ShipmentRepository shipmentRepository;

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

    private UUID userId;
    private ProductVariant testVariant;
    private OrderResponse testOrder;

    @BeforeEach
    void setUp() {
        shipmentRepository.deleteAll();
        inventoryRecordRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        userId = UUID.randomUUID();

        Category category = Category.builder()
                .name("Fresh Mushrooms")
                .slug("fresh-mushrooms")
                .build();
        category = categoryRepository.save(category);

        Product product = Product.builder()
                .category(category)
                .title("Fresh Button Mushroom")
                .slug("fresh-button-mushroom-200g")
                .productType(com.sporekart.catalog.domain.ProductType.FRESH_MUSHROOM)
                .isActive(true)
                .build();
        product = productRepository.save(product);

        testVariant = ProductVariant.builder()
                .product(product)
                .variantName("200g Pack")
                .sku("MUSH-BTN-200G")
                .priceInr(new BigDecimal("200.00"))
                .compareAtPriceInr(new BigDecimal("250.00"))
                .stockQuantity(100)
                .isActive(true)
                .build();
        testVariant = variantRepository.save(testVariant);

        Cart cart = cartService.getOrCreateCart(userId, null);
        cartService.addItemToCart(userId, null, testVariant.getId(), 2);

        OrderAddressSnapshot address = OrderAddressSnapshot.builder()
                .recipientName("Test Recipient")
                .phone("9876543210")
                .line1("123 Farm House Road")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();

        CreateOrderRequest request = new CreateOrderRequest(null, address, "Handle with care");

        testOrder = orderService.createOrderFromCart(userId, null, "IDEM-SHIP-" + UUID.randomUUID(), request);

        // Initiate & Verify Payment to transition order to PAID
        PaymentDtos.InitiatePaymentResponse initResp = paymentService.initiatePayment(testOrder.getId());
        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId(initResp.getRazorpayOrderId())
                .razorpayPaymentId("pay_mock_ship_" + UUID.randomUUID().toString().substring(0, 8))
                .razorpaySignature("mock_sig")
                .build();
        paymentService.verifyPayment(verifyReq);
    }

    @Test
    void testShipmentCreationForPaidOrder() {
        Shipment shipment = shippingService.createShipmentForOrder(testOrder.getId());

        assertNotNull(shipment);
        assertNotNull(shipment.getId());
        assertEquals(testOrder.getId(), shipment.getOrderId());
        assertNotNull(shipment.getAwbCode());
        assertNotNull(shipment.getProviderShipmentId());
        assertEquals(ShipmentStatus.PICKUP_SCHEDULED, shipment.getStatus());

        OrderResponse updatedOrder = orderService.getOrderById(testOrder.getId());
        assertEquals(OrderStatus.SHIPPED, updatedOrder.getStatus());
    }

    @Test
    void testShipmentTrackingUpdate() {
        Shipment shipment = shippingService.createShipmentForOrder(testOrder.getId());

        ShipmentTracking tracking = shippingService.updateTrackingStatus(shipment.getId());
        assertNotNull(tracking);
        assertNotNull(tracking.getAwbCode());
        assertNotNull(tracking.getCurrentStatus());
    }

    @Test
    void testShippingWebhookProcessing() {
        Shipment shipment = shippingService.createShipmentForOrder(testOrder.getId());

        shippingService.processWebhookUpdate(
                shipment.getAwbCode(),
                "DELIVERED",
                "Customer Address, Pune",
                "Package delivered successfully",
                "{\"status\":\"DELIVERED\"}"
        );

        Shipment updatedShipment = shippingService.getShipmentById(shipment.getId()).orElseThrow();
        assertEquals(ShipmentStatus.DELIVERED, updatedShipment.getStatus());
        assertNotNull(updatedShipment.getDeliveredAt());

        OrderResponse updatedOrder = orderService.getOrderById(testOrder.getId());
        assertEquals(OrderStatus.DELIVERED, updatedOrder.getStatus());
    }

    @Test
    void testShipmentCancellation() {
        Shipment shipment = shippingService.createShipmentForOrder(testOrder.getId());

        shippingService.cancelShipment(shipment.getId(), "Customer requested address change");

        Shipment cancelledShipment = shippingService.getShipmentById(shipment.getId()).orElseThrow();
        assertEquals(ShipmentStatus.CANCELLED, cancelledShipment.getStatus());
    }
}
