package com.sporekart;

import com.sporekart.cart.application.CartService;
import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.CategoryRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.order.api.dto.CreateOrderRequest;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ExtendedIntegrationTest {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            if (DockerClientFactory.instance().isDockerAvailable()) {
                postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                        .withDatabaseName("sporekart_test")
                        .withUsername("postgres")
                        .withPassword("postgres");
                postgres.start();
            }
        } catch (Throwable t) {
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.flyway.enabled", () -> "true");
        }
    }

    @Autowired
    private CatalogApplicationService catalogService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TrainingService trainingService;

    private Category testCategory;
    private Product testProduct;
    private ProductVariant testVariant;

    @BeforeEach
    void setUpCatalogData() {
        if (testCategory == null) {
            testCategory = categoryRepository.save(Category.builder()
                    .name("Test Category Integration")
                    .slug("test-cat-int-" + UUID.randomUUID().toString().substring(0, 8))
                    .description("Test Category for Integration")
                    .build());

            testProduct = productRepository.save(Product.builder()
                    .title("Oyster Mushroom Spawn")
                    .slug("oyster-spawn-int-" + UUID.randomUUID().toString().substring(0, 8))
                    .description("High quality spawn")
                    .category(testCategory)
                    .productType(ProductType.SPAWN_SEED)
                    .gstRatePercent(new BigDecimal("5.0"))
                    .status(ProductStatus.ACTIVE)
                    .isActive(true)
                    .build());

            testVariant = variantRepository.save(ProductVariant.builder()
                    .product(testProduct)
                    .variantName("1kg Bag")
                    .sku("OYST-SPAWN-1KG-" + UUID.randomUUID().toString().substring(0, 6))
                    .priceInr(new BigDecimal("250.00"))
                    .stockQuantity(100)
                    .build());

            inventoryService.initializeInventory(testVariant.getId(), 100);
        }
    }

    @Test
    @DisplayName("ORD-22: Full Order Lifecycle (Cart -> Order -> Payment -> Delivery -> Tax Invoice)")
    void testFullOrderLifecycle_ORD22() {
        UUID userId = UUID.randomUUID();
        String sessionId = "sess-" + UUID.randomUUID().toString().substring(0, 8);

        // 1. Add item to cart
        cartService.addItemToCart(userId, sessionId, testVariant.getId(), 2);

        // 2. Create Order Request
        OrderAddressSnapshot shippingAddr = OrderAddressSnapshot.builder()
                .recipientName("John Doe Integration")
                .phone("9876543210")
                .line1("123 Green Lane")
                .city("Bangalore")
                .state("Karnataka")
                .pincode("560001")
                .build();

        CreateOrderRequest orderReq = new CreateOrderRequest(null, shippingAddr, "Test order notes");

        // 3. Create Order
        OrderResponse order = orderService.createOrderFromCart(userId, sessionId, "idemp-int-001", orderReq);
        assertNotNull(order);
        assertNotNull(order.getId());
        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(2, order.getItems().get(0).getQuantity());
        assertTrue(order.getTotalAmountInr().compareTo(BigDecimal.ZERO) > 0);

        // Verify inventory reserved
        InventoryRecord invRecord = inventoryService.getInventoryRecord(testVariant.getId());
        assertEquals(2, invRecord.getReservedQuantity());

        // 4. Initiate Payment
        PaymentDtos.InitiatePaymentResponse payInit = paymentService.initiatePayment(order.getId());
        assertNotNull(payInit);
        assertNotNull(payInit.getRazorpayOrderId());

        // 5. Verify Payment
        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(order.getId())
                .razorpayOrderId(payInit.getRazorpayOrderId())
                .razorpayPaymentId("pay_mock_123456")
                .razorpaySignature("mock_signature_valid")
                .build();

        PaymentDtos.VerifyPaymentResponse verifyResp = paymentService.verifyPayment(verifyReq);
        assertTrue(verifyResp.isSuccess());

        // Refresh Order & Check Status
        OrderResponse paidOrder = orderService.getOrderById(order.getId());
        assertEquals(OrderStatus.PAID, paidOrder.getStatus());

        // 6. Transition Order Status to DELIVERED
        orderService.updateOrderStatus(order.getId(), OrderStatus.SHIPPED, "Shipped via BlueDart", "ADMIN");
        OrderResponse deliveredOrder = orderService.updateOrderStatus(order.getId(), OrderStatus.DELIVERED, "Delivered to customer", "ADMIN");
        assertEquals(OrderStatus.DELIVERED, deliveredOrder.getStatus());

        // 7. Generate GST Tax Invoice PDF
        byte[] pdfBytes = orderService.generateInvoicePdf(order.getId(), userId);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        // Verify PDF Magic Bytes (%PDF-)
        String pdfHeader = new String(pdfBytes, 0, Math.min(pdfBytes.length, 5));
        assertEquals("%PDF-", pdfHeader);
    }

    @Test
    @DisplayName("INV-8 / INV-9: Full Inventory Reservation -> Confirm -> Cancel Cycle")
    void testFullInventoryReservationConfirmCancelCycle_INV8_INV9() {
        // Create fresh variant for precise inventory isolation
        ProductVariant invVariant = variantRepository.save(ProductVariant.builder()
                .product(testProduct)
                .variantName("2kg Bag Inv Test")
                .sku("INV-TEST-2KG-" + UUID.randomUUID().toString().substring(0, 6))
                .priceInr(new BigDecimal("450.00"))
                .stockQuantity(50)
                .build());

        inventoryService.initializeInventory(invVariant.getId(), 50);

        InventoryRecord rec0 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(50, rec0.getAvailableQuantity());
        assertEquals(0, rec0.getReservedQuantity());
        assertEquals(0, rec0.getSoldQuantity());

        // Step A: Reserve 10 units for Order 1
        inventoryService.reserveInventory(invVariant.getId(), 10, "REF-ORD-1", "CUSTOMER");
        InventoryRecord rec1 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(40, rec1.getAvailableQuantity());
        assertEquals(10, rec1.getReservedQuantity());
        assertEquals(0, rec1.getSoldQuantity());

        // Step B: Confirm Purchase (10 units reserved -> sold)
        inventoryService.confirmPurchase(invVariant.getId(), 10, "REF-ORD-1", "PAYMENT_CONFIRMED");
        InventoryRecord rec2 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(40, rec2.getAvailableQuantity());
        assertEquals(0, rec2.getReservedQuantity());
        assertEquals(10, rec2.getSoldQuantity());

        // Step C: Cancel Order 1 and Restock from Sold
        inventoryService.releaseCancelledOrder(invVariant.getId(), 10, "REF-ORD-1", true, "Order Cancelled", "ADMIN");
        InventoryRecord rec3 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(50, rec3.getAvailableQuantity());
        assertEquals(0, rec3.getReservedQuantity());
        assertEquals(0, rec3.getSoldQuantity());

        // Step D: Reserve 5 units for Order 2, then Release Reservation before Purchase
        inventoryService.reserveInventory(invVariant.getId(), 5, "REF-ORD-2", "CUSTOMER");
        InventoryRecord rec4 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(45, rec4.getAvailableQuantity());
        assertEquals(5, rec4.getReservedQuantity());

        inventoryService.releaseReservation(invVariant.getId(), 5, "REF-ORD-2", "Checkout Timeout", "SYSTEM");
        InventoryRecord rec5 = inventoryService.getInventoryRecord(invVariant.getId());
        assertEquals(50, rec5.getAvailableQuantity());
        assertEquals(0, rec5.getReservedQuantity());

        // Audit log trail check
        List<InventoryAuditEvent> trail = inventoryService.getAuditTrail(invVariant.getId());
        assertFalse(trail.isEmpty());
        assertTrue(trail.size() >= 5);
    }

    @Test
    @DisplayName("TRN-4 / TRN-5: Full Enrollment Lifecycle (Course -> Batch -> Enroll -> Confirm -> Capacity Limit -> Cancel -> Re-enroll)")
    void testFullEnrollmentLifecycle_TRN4_TRN5() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CourseCategory cat = trainingService.createCategory("Mushroom Cultivation", "mushroom-cult-" + uniqueSuffix, "Training Category");
        Course course = trainingService.createCourse(cat.getId(), "Advanced Spawn Masterclass", "spawn-master-" + uniqueSuffix, "Deep dive spawn", 5, new BigDecimal("4999.00"));

        // Create Batch with capacity = 2 starting 14 days in future
        Batch batch = trainingService.createBatch(course.getId(), "BATCH-CAP2-" + uniqueSuffix, LocalDate.now().plusDays(14), LocalDate.now().plusDays(19), 2);
        assertNotNull(batch);

        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID user3 = UUID.randomUUID();

        // 1. User 1 Enrolls & Confirms Payment
        Enrollment enr1 = trainingService.enrollCustomer(user1, batch.getId());
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enr1.getStatus());

        Enrollment conf1 = trainingService.confirmEnrollmentPayment(enr1.getId(), "TXN-USER1-PAY");
        assertEquals(EnrollmentStatus.CONFIRMED, conf1.getStatus());

        // 2. User 2 Enrolls & Confirms Payment (Batch is now FULL)
        Enrollment enr2 = trainingService.enrollCustomer(user2, batch.getId());
        trainingService.confirmEnrollmentPayment(enr2.getId(), "TXN-USER2-PAY");

        // 3. User 3 Tries to Enroll -> Should Fail (Batch Capacity Full)
        assertThrows(IllegalStateException.class, () -> trainingService.enrollCustomer(user3, batch.getId()));

        // 4. User 1 Cancels Enrollment (>7 days before start date)
        Enrollment cancelledEnr1 = trainingService.cancelEnrollment(conf1.getId(), user1, "Schedule Conflict");
        assertEquals(EnrollmentStatus.CANCELLED, cancelledEnr1.getStatus());

        // 5. User 3 can now enroll successfully because seat is released
        Enrollment enr3 = trainingService.enrollCustomer(user3, batch.getId());
        assertNotNull(enr3);
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enr3.getStatus());
        Enrollment conf3 = trainingService.confirmEnrollmentPayment(enr3.getId(), "TXN-USER3-PAY");
        assertEquals(EnrollmentStatus.CONFIRMED, conf3.getStatus());
    }
}
