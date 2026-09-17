package com.sporekart.catalog;

import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class InventoryConcurrencyTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private InventoryAuditRepository inventoryAuditRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private UUID testVariantId;

    @BeforeEach
    void setUp() {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            inventoryAuditRepository.deleteAll();
            inventoryRecordRepository.deleteAll();
            variantRepository.deleteAll();
            productRepository.deleteAll();

            String uniqueSlug = "oyster-spawn-test-" + UUID.randomUUID().toString().substring(0, 8);

            Product product = Product.builder()
                    .title("Oyster Spawn Concurrency Test")
                    .slug(uniqueSlug)
                    .productType(ProductType.SPAWN_SEED)
                    .status(ProductStatus.ACTIVE)
                    .gstRatePercent(BigDecimal.ZERO)
                    .isActive(true)
                    .build();
            Product savedProduct = productRepository.save(product);

            ProductVariant variant = ProductVariant.builder()
                    .product(savedProduct)
                    .variantName("1kg Bag")
                    .sku("SKU-" + UUID.randomUUID().toString().substring(0, 8))
                    .priceInr(new BigDecimal("150.00"))
                    .stockQuantity(2)
                    .isActive(true)
                    .build();
            ProductVariant savedVariant = variantRepository.save(variant);
            testVariantId = savedVariant.getId();

            inventoryService.initializeInventory(testVariantId, 2);
        });
    }

    @Test
    void testConcurrentCheckoutReservations() throws Exception {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < numberOfThreads; i++) {
            final int threadIdx = i;
            futures.add(executorService.submit(() -> {
                try {
                    latch.await(); // Wait for sync start
                    TransactionTemplate template = new TransactionTemplate(transactionManager);
                    template.executeWithoutResult(status -> {
                        inventoryService.reserveInventory(testVariantId, 1, "ORDER-THREAD-" + threadIdx, "USER-" + threadIdx);
                    });
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                }
            }));
        }

        latch.countDown(); // Trigger all threads simultaneously
        for (Future<?> future : futures) {
            future.get();
        }
        executorService.shutdown();

        // Validate results
        assertEquals(2, successCount.get(), "Exactly 2 reservations must succeed for 2 available items");
        assertEquals(8, failureCount.get(), "Exactly 8 reservations must fail due to insufficient inventory");

        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            InventoryRecord record = inventoryService.getInventoryRecord(testVariantId);
            assertEquals(0, record.getAvailableQuantity());
            assertEquals(2, record.getReservedQuantity());
            assertEquals(0, record.getSoldQuantity());
        });
    }

    @Test
    void testReservationReleaseLifecycle() {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            // Re-init with 5 stock
            inventoryService.initializeInventory(testVariantId, 5);

            // Reserve 3 items
            inventoryService.reserveInventory(testVariantId, 3, "ORDER-101", "USER-1");
            InventoryRecord record1 = inventoryService.getInventoryRecord(testVariantId);
            assertEquals(2, record1.getAvailableQuantity());
            assertEquals(3, record1.getReservedQuantity());

            // Release reservation
            inventoryService.releaseReservation(testVariantId, 3, "ORDER-101", "Payment Timed Out", "SYSTEM");
            InventoryRecord record2 = inventoryService.getInventoryRecord(testVariantId);
            assertEquals(5, record2.getAvailableQuantity());
            assertEquals(0, record2.getReservedQuantity());
        });
    }

    @Test
    void testPurchaseConfirmationLifecycle() {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            inventoryService.initializeInventory(testVariantId, 10);

            // Reserve 4 items
            inventoryService.reserveInventory(testVariantId, 4, "ORDER-202", "USER-2");

            // Confirm Purchase (Razorpay Paid)
            inventoryService.confirmPurchase(testVariantId, 4, "ORDER-202", "PAYMENT_WEBHOOK");

            InventoryRecord record = inventoryService.getInventoryRecord(testVariantId);
            assertEquals(6, record.getAvailableQuantity());
            assertEquals(0, record.getReservedQuantity());
            assertEquals(4, record.getSoldQuantity());
        });
    }

    @Test
    void testPreventNegativeInventory() {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            inventoryService.initializeInventory(testVariantId, 1);
        });

        // Attempting to reserve 5 items when only 1 available
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.reserveInventory(testVariantId, 5, "ORDER-ERR", "USER-ERR")
        );
        assertTrue(ex.getMessage().contains("Insufficient inventory"));

        template.executeWithoutResult(status -> {
            InventoryRecord record = inventoryService.getInventoryRecord(testVariantId);
            assertTrue(record.getAvailableQuantity() >= 0, "Available quantity must never be negative");
            assertTrue(record.getReservedQuantity() >= 0, "Reserved quantity must never be negative");
        });
    }

    @Test
    void testInventoryAuditEventsLogged() {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            inventoryService.initializeInventory(testVariantId, 10);
            inventoryService.reserveInventory(testVariantId, 2, "ORDER-AUDIT", "USER-AUDIT");
            inventoryService.confirmPurchase(testVariantId, 2, "ORDER-AUDIT", "PAYMENT_WEBHOOK");

            List<InventoryAuditEvent> events = inventoryService.getAuditTrail(testVariantId);
            assertTrue(events.size() >= 3, "At least 3 audit log events must be recorded");

            assertEquals(InventoryEventType.CONFIRMED_SOLD, events.get(0).getEventType());
            assertEquals(InventoryEventType.RESERVED, events.get(1).getEventType());
            assertEquals(InventoryEventType.INITIALIZED, events.get(2).getEventType());
        });
    }
}
