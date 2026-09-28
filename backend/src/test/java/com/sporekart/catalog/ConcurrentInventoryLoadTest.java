package com.sporekart.catalog;

import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.InventoryRecord;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.InventoryAuditRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
public class ConcurrentInventoryLoadTest {

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

            String uniqueSlug = "oyster-spawn-load-" + UUID.randomUUID().toString().substring(0, 8);

            Product product = Product.builder()
                    .title("High Concurrency Inventory Load Test")
                    .slug(uniqueSlug)
                    .productType(ProductType.SPAWN_SEED)
                    .status(ProductStatus.ACTIVE)
                    .gstRatePercent(BigDecimal.ZERO)
                    .isActive(true)
                    .build();
            Product savedProduct = productRepository.save(product);

            ProductVariant variant = ProductVariant.builder()
                    .product(savedProduct)
                    .variantName("500g Pack")
                    .sku("SKU-LOAD-" + UUID.randomUUID().toString().substring(0, 8))
                    .priceInr(new BigDecimal("299.00"))
                    .stockQuantity(1)
                    .isActive(true)
                    .build();
            ProductVariant savedVariant = variantRepository.save(variant);
            testVariantId = savedVariant.getId();

            inventoryService.initializeInventory(testVariantId, 1);
        });
    }

    @Test
    @DisplayName("INV-6 Load: 50 concurrent buyers competing for 1 unit of stock - availableQuantity must NEVER drop below 0")
    public void testHighConcurrencyStockReservation() throws Exception {
        int numberOfThreads = 50;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<String> failureReasons = new CopyOnWriteArrayList<>();

        for (int i = 0; i < numberOfThreads; i++) {
            final int threadIdx = i;
            executorService.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all 50 threads to fire simultaneously
                    TransactionTemplate template = new TransactionTemplate(transactionManager);
                    template.executeWithoutResult(status -> {
                        inventoryService.reserveInventory(testVariantId, 1, "ORDER-CONC-" + threadIdx, "USER-" + threadIdx);
                    });
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    failureReasons.add(e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Release the latch to start all 50 threads concurrently
        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executorService.shutdown();

        assertTrue(completed, "All 50 threads should complete within 30 seconds");

        // Exactly 1 thread must succeed, and 49 must fail due to stock depletion
        assertEquals(1, successCount.get(), "Exactly 1 buyer must succeed in reserving the single stock unit");
        assertEquals(49, failureCount.get(), "Exactly 49 buyers must fail due to insufficient inventory");

        // Inspect final inventory state in DB
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> {
            InventoryRecord record = inventoryService.getInventoryRecord(testVariantId);
            assertNotNull(record, "Inventory record must exist");
            assertEquals(0, record.getAvailableQuantity(), "Available quantity must be exactly 0");
            assertEquals(1, record.getReservedQuantity(), "Reserved quantity must be exactly 1");
            assertTrue(record.getAvailableQuantity() >= 0, "Available quantity must NEVER go negative under heavy concurrent load!");
        });
    }
}
