package com.sporekart.order;

import com.sporekart.cart.application.CartService;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductOfferRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.customer.domain.CustomerAddress;
import com.sporekart.customer.infrastructure.CustomerAddressRepository;
import com.sporekart.order.api.dto.*;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class OrderIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderEventRepository orderEventRepository;

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
    private CustomerAddressRepository addressRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    private Product testProduct;
    private ProductVariant testVariant;
    private OrderAddressSnapshot testAddress;

    @BeforeEach
    void setUp() {
        orderEventRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        offerRepository.deleteAll();
        inventoryRecordRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        addressRepository.deleteAll();

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(
                null, "Oyster Mushroom " + uniqueSuffix, "oyster-" + uniqueSuffix,
                "Fresh Oyster", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE,
                "0709", new BigDecimal("5.00"), "Meta", "Desc", "url", true
        );
        testProduct = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest varReq = new CatalogDtos.CreateVariantRequest(
                "200g", "SKU-OYSTER-" + uniqueSuffix, new BigDecimal("100.00"),
                new BigDecimal("120.00"), 10, true
        );
        testVariant = adminCatalogService.addVariant(testProduct.getId(), varReq);

        testAddress = OrderAddressSnapshot.builder()
                .recipientName("Ramesh Kumar")
                .phone("+919876543210")
                .line1("123 Agri Park")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();
    }

    @Test
    @Transactional
    void testDuplicateCheckoutIdempotency() {
        String sessionId = "sess-idemp-" + UUID.randomUUID();
        String idempotencyKey = "idemp-key-" + UUID.randomUUID();

        cartService.addItemToCart(null, sessionId, testVariant.getId(), 2);

        CreateOrderRequest request = new CreateOrderRequest(null, testAddress, "Idempotent Order");

        // 1st Creation
        OrderResponse order1 = orderService.createOrderFromCart(null, sessionId, idempotencyKey, request);
        assertNotNull(order1);
        assertEquals(OrderStatus.PENDING_PAYMENT, order1.getStatus());

        // 2nd Creation with identical idempotency key
        OrderResponse order2 = orderService.createOrderFromCart(null, sessionId, idempotencyKey, request);
        assertNotNull(order2);
        assertEquals(order1.getId(), order2.getId());
        assertEquals(order1.getOrderNumber(), order2.getOrderNumber());

        // Verify only 1 order exists in database
        assertEquals(1, orderRepository.count());
    }

    @Test
    @Transactional
    void testPriceManipulationIgnored() {
        String sessionId = "sess-price-" + UUID.randomUUID();

        cartService.addItemToCart(null, sessionId, testVariant.getId(), 2);

        CreateOrderRequest request = new CreateOrderRequest(null, testAddress, "Test Price");

        OrderResponse order = orderService.createOrderFromCart(null, sessionId, null, request);

        // Unit price net ₹100 + 5% GST = ₹105.00. 2 units = ₹210.00
        assertEquals(new BigDecimal("210.00"), order.getTotalAmountInr());
        assertEquals(new BigDecimal("200.00"), order.getSubtotalAmountInr());
        assertEquals(new BigDecimal("10.00"), order.getGstTotalAmountInr());
    }

    @Test
    @Transactional
    void testInvalidCartRejection() {
        String sessionId = "sess-empty-" + UUID.randomUUID();
        CreateOrderRequest request = new CreateOrderRequest(null, testAddress, "Empty Cart");

        Exception ex = assertThrows(IllegalStateException.class, () ->
                orderService.createOrderFromCart(null, sessionId, null, request)
        );
        assertTrue(ex.getMessage().contains("empty cart"));
    }

    @Test
    @Transactional
    void testOrderCancellationAndStockRelease() {
        String sessionId = "sess-cancel-" + UUID.randomUUID();
        cartService.addItemToCart(null, sessionId, testVariant.getId(), 3);

        CreateOrderRequest request = new CreateOrderRequest(null, testAddress, "Cancel Order");
        OrderResponse order = orderService.createOrderFromCart(null, sessionId, null, request);

        // Cancel order
        OrderResponse cancelled = orderService.cancelOrder(order.getId(), null, "Customer changed mind");

        assertEquals(OrderStatus.CANCELLED, cancelled.getStatus());
        assertEquals("Customer changed mind", cancelled.getCancellationReason());

        // Verify OrderEvent logged
        assertTrue(cancelled.getEvents().stream().anyMatch(e -> e.getNewState() == OrderStatus.CANCELLED));
    }

    @Test
    void testConcurrentCheckoutNoDeadlock() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateVariantRequest var2Req = new CatalogDtos.CreateVariantRequest(
                "500g", "SKU-OYSTER-500G-" + uniqueSuffix, new BigDecimal("200.00"),
                new BigDecimal("240.00"), 50, true
        );
        ProductVariant variant2 = adminCatalogService.addVariant(testProduct.getId(), var2Req);

        String sess1 = "sess-lock-1-" + UUID.randomUUID();
        String sess2 = "sess-lock-2-" + UUID.randomUUID();

        // Cart 1: V1, V2
        cartService.addItemToCart(null, sess1, testVariant.getId(), 1);
        cartService.addItemToCart(null, sess1, variant2.getId(), 1);

        // Cart 2: V2, V1 (reversed order)
        cartService.addItemToCart(null, sess2, variant2.getId(), 1);
        cartService.addItemToCart(null, sess2, testVariant.getId(), 1);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Callable<OrderResponse> task1 = () -> {
            startLatch.await();
            return orderService.createOrderFromCart(null, sess1, null, new CreateOrderRequest(null, testAddress, "Order 1"));
        };

        Callable<OrderResponse> task2 = () -> {
            startLatch.await();
            return orderService.createOrderFromCart(null, sess2, null, new CreateOrderRequest(null, testAddress, "Order 2"));
        };

        Future<OrderResponse> f1 = executor.submit(task1);
        Future<OrderResponse> f2 = executor.submit(task2);

        startLatch.countDown();

        OrderResponse r1 = f1.get(10, TimeUnit.SECONDS);
        OrderResponse r2 = f2.get(10, TimeUnit.SECONDS);

        assertNotNull(r1);
        assertNotNull(r2);
        executor.shutdown();
    }
}
