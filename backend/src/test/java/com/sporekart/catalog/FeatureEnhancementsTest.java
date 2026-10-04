package com.sporekart.catalog;

import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.InventoryRecord;
import com.sporekart.catalog.infrastructure.InventoryAuditRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.promotion.application.PromotionService;
import com.sporekart.promotion.api.PromotionDtos;
import com.sporekart.promotion.domain.Promotion;
import com.sporekart.promotion.domain.PromotionStatus;
import com.sporekart.promotion.domain.PromotionType;
import com.sporekart.promotion.infrastructure.PromotionRepository;
import com.sporekart.promotion.infrastructure.PromotionUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeatureEnhancementsTest {

    @Mock
    private InventoryRecordRepository inventoryRecordRepository;
    @Mock
    private InventoryAuditRepository inventoryAuditRepository;
    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private PromotionRepository promotionRepository;
    @Mock
    private PromotionUsageRepository promotionUsageRepository;

    private InventoryService inventoryService;
    private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(inventoryRecordRepository, inventoryAuditRepository, variantRepository);
        promotionService = new PromotionService(promotionRepository, promotionUsageRepository);
    }

    @Test
    @DisplayName("Replenish Stock: 35 + 10 = 45 units")
    void testStockReplenishmentSuccess() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord initialRecord = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(35)
                .reservedQuantity(0)
                .soldQuantity(5)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(initialRecord));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord result = inventoryService.replenishInventory(variantId, 10, "Restock shipment", "ADMIN");

        assertEquals(45, result.getAvailableQuantity());
        verify(inventoryRecordRepository).save(initialRecord);
        verify(inventoryAuditRepository).save(any());
    }

    @Test
    @DisplayName("Replenish Stock: Rejects 0 and negative quantities")
    void testStockReplenishmentInvalidQuantities() {
        UUID variantId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> inventoryService.replenishInventory(variantId, 0, "Reason", "ADMIN"));
        assertThrows(IllegalArgumentException.class, () -> inventoryService.replenishInventory(variantId, -5, "Reason", "ADMIN"));
    }

    @Test
    @DisplayName("Batch Promotion: Valid batch promo code applies percentage discount")
    void testBatchPromotionValidationSuccess() {
        UUID batchId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID())
                .name("Masterclass 10% OFF")
                .code("MUSHROOM10")
                .type(PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .maximumDiscount(new BigDecimal("500.00"))
                .minimumOrderValue(new BigDecimal("1000.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.TRAINEE)
                .status(PromotionStatus.ACTIVE)
                .usageCount(0)
                .targetBatchId(batchId)
                .build();

        when(promotionRepository.findByCode("MUSHROOM10")).thenReturn(Optional.of(promo));

        PromotionDtos.PromotionValidationResult result = promotionService.validateAndCalculateForBatch(
                "MUSHROOM10",
                UUID.randomUUID(),
                batchId,
                courseId,
                new BigDecimal("2000.00")
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("200.00"), result.getDiscountAmountInr());
        assertEquals(new BigDecimal("1800.00"), result.getFinalAmountInr());
    }

    @Test
    @DisplayName("Batch Promotion: Ineligible batch returns validation error")
    void testBatchPromotionIneligibleBatch() {
        UUID eligibleBatchId = UUID.randomUUID();
        UUID userBatchId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID())
                .name("Specific Batch Promo")
                .code("BATCH20")
                .type(PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("20.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.TRAINEE)
                .status(PromotionStatus.ACTIVE)
                .usageCount(0)
                .targetBatchId(eligibleBatchId)
                .build();

        when(promotionRepository.findByCode("BATCH20")).thenReturn(Optional.of(promo));

        PromotionDtos.PromotionValidationResult result = promotionService.validateAndCalculateForBatch(
                "BATCH20",
                UUID.randomUUID(),
                userBatchId,
                courseId,
                new BigDecimal("2000.00")
        );

        assertFalse(result.isValid());
        assertTrue(result.getMessage().contains("not eligible for the selected training batch"));
    }

    @Test
    @DisplayName("Target Audience: Customer-only promo code rejected during batch enrollment")
    void testCustomerPromotionCannotBeUsedForBatchEnrollment() {
        UUID batchId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID())
                .name("Free Shipping Customer Promo")
                .code("FREESHIP")
                .type(PromotionType.FREE_SHIPPING)
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.CUSTOMER)
                .status(PromotionStatus.ACTIVE)
                .usageCount(0)
                .build();

        when(promotionRepository.findByCode("FREESHIP")).thenReturn(Optional.of(promo));

        PromotionDtos.PromotionValidationResult result = promotionService.validateAndCalculateForBatch(
                "FREESHIP",
                UUID.randomUUID(),
                batchId,
                courseId,
                new BigDecimal("2000.00")
        );

        assertFalse(result.isValid());
        assertTrue(result.getMessage().contains("dedicated for product store purchases"));
    }

    @Test
    @DisplayName("Target Audience: Trainee-only promo code rejected during product cart checkout")
    void testTraineePromotionCannotBeUsedForCartCheckout() {
        Promotion promo = Promotion.builder()
                .id(UUID.randomUUID())
                .name("Trainee Masterclass Promo")
                .code("MUSHROOM10")
                .type(PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.TRAINEE)
                .status(PromotionStatus.ACTIVE)
                .usageCount(0)
                .build();

        when(promotionRepository.findByCode("MUSHROOM10")).thenReturn(Optional.of(promo));

        PromotionDtos.PromotionValidationResult result = promotionService.validateAndCalculate(
                "MUSHROOM10",
                UUID.randomUUID(),
                "session-123",
                new BigDecimal("1000.00"),
                java.util.Collections.emptyList()
        );

        assertFalse(result.isValid());
        assertTrue(result.getMessage().contains("dedicated for training batch enrollments"));
    }
}
