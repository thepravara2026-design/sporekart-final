package com.sporekart.catalog.application;

import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.InventoryAuditRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRecordRepository inventoryRecordRepository;
    private final InventoryAuditRepository inventoryAuditRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional
    public InventoryRecord initializeInventory(UUID variantId, int initialAvailableQuantity) {
        if (initialAvailableQuantity < 0) {
            throw new IllegalArgumentException("Initial available quantity cannot be negative");
        }

        InventoryRecord record = inventoryRecordRepository.findByVariantId(variantId)
                .orElseGet(() -> InventoryRecord.builder()
                        .variantId(variantId)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .soldQuantity(0)
                        .build());

        record.setAvailableQuantity(initialAvailableQuantity);
        InventoryRecord saved = inventoryRecordRepository.save(record);

        recordAuditLog(variantId, InventoryEventType.INITIALIZED, initialAvailableQuantity, saved, "INIT", "Initial stock setup", "SYSTEM");
        return saved;
    }

    @Transactional
    public InventoryRecord reserveInventory(UUID variantId, int quantity, String referenceId, String createdBy) {
        InventoryRecord record = inventoryRecordRepository.findByVariantIdForUpdate(variantId)
                .orElseGet(() -> {
                    // Auto-initialize if not yet present using variant's stockQuantity
                    ProductVariant v = variantRepository.findById(variantId)
                            .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + variantId));
                    return inventoryRecordRepository.save(InventoryRecord.builder()
                            .variantId(variantId)
                            .availableQuantity(v.getStockQuantity())
                            .reservedQuantity(0)
                            .soldQuantity(0)
                            .build());
                });

        record.reserve(quantity);
        InventoryRecord saved = inventoryRecordRepository.save(record);

        // Sync variant stock quantity for public display
        syncVariantDisplayStock(variantId, saved.getAvailableQuantity());

        recordAuditLog(variantId, InventoryEventType.RESERVED, -quantity, saved, referenceId, "Checkout reservation", createdBy);
        return saved;
    }

    @Transactional
    public InventoryRecord releaseReservation(UUID variantId, int quantity, String referenceId, String reason, String createdBy) {
        InventoryRecord record = inventoryRecordRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for variant: " + variantId));

        record.release(quantity);
        InventoryRecord saved = inventoryRecordRepository.save(record);

        syncVariantDisplayStock(variantId, saved.getAvailableQuantity());

        recordAuditLog(variantId, InventoryEventType.RELEASED, quantity, saved, referenceId, reason != null ? reason : "Reservation released", createdBy);
        return saved;
    }

    @Transactional
    public InventoryRecord confirmPurchase(UUID variantId, int quantity, String referenceId, String createdBy) {
        InventoryRecord record = inventoryRecordRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for variant: " + variantId));

        record.confirmSold(quantity);
        InventoryRecord saved = inventoryRecordRepository.save(record);

        recordAuditLog(variantId, InventoryEventType.CONFIRMED_SOLD, 0, saved, referenceId, "Purchase completed", createdBy);
        return saved;
    }

    @Transactional
    public InventoryRecord releaseCancelledOrder(UUID variantId, int quantity, String referenceId, boolean fromSold, String reason, String createdBy) {
        InventoryRecord record = inventoryRecordRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for variant: " + variantId));

        record.restockCancelled(quantity, fromSold);
        InventoryRecord saved = inventoryRecordRepository.save(record);

        syncVariantDisplayStock(variantId, saved.getAvailableQuantity());

        recordAuditLog(variantId, InventoryEventType.CANCELLED_RESTOCKED, quantity, saved, referenceId, reason != null ? reason : "Order cancelled", createdBy);
        return saved;
    }

    @Transactional(readOnly = true)
    public InventoryRecord getInventoryRecord(UUID variantId) {
        return inventoryRecordRepository.findByVariantId(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for variant: " + variantId));
    }

    @Transactional(readOnly = true)
    public List<InventoryAuditEvent> getAuditTrail(UUID variantId) {
        return inventoryAuditRepository.findByVariantIdOrderByCreatedAtDesc(variantId);
    }

    private void syncVariantDisplayStock(UUID variantId, int availableQuantity) {
        variantRepository.findById(variantId).ifPresent(v -> {
            v.setStockQuantity(availableQuantity);
            variantRepository.save(v);
        });
    }

    private void recordAuditLog(UUID variantId, InventoryEventType eventType, int quantityChanged, InventoryRecord record, String referenceId, String reason, String createdBy) {
        InventoryAuditEvent audit = InventoryAuditEvent.builder()
                .variantId(variantId)
                .eventType(eventType)
                .quantityChanged(quantityChanged)
                .availableQuantityAfter(record.getAvailableQuantity())
                .reservedQuantityAfter(record.getReservedQuantity())
                .soldQuantityAfter(record.getSoldQuantity())
                .referenceId(referenceId)
                .reason(reason)
                .createdBy(createdBy)
                .build();
        inventoryAuditRepository.save(audit);
    }
}
