package com.sporekart.catalog.application;

import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.InventoryAuditRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceUnitTest {

    @Mock
    private InventoryRecordRepository inventoryRecordRepository;

    @Mock
    private InventoryAuditRepository inventoryAuditRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    @DisplayName("INV-1: initializeInventory sets stock and logs audit trail")
    void INV_1_initialize_inventory_success() {
        UUID variantId = UUID.randomUUID();
        when(inventoryRecordRepository.findByVariantId(variantId)).thenReturn(Optional.empty());
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord record = inventoryService.initializeInventory(variantId, 100);

        assertNotNull(record);
        assertEquals(100, record.getAvailableQuantity());
        assertEquals(0, record.getReservedQuantity());
        assertEquals(0, record.getSoldQuantity());
        verify(inventoryAuditRepository, times(1)).save(any(InventoryAuditEvent.class));
    }

    @Test
    @DisplayName("INV-2: initializeInventory with negative quantity throws IllegalArgumentException")
    void INV_2_initialize_negative_quantity_fails() {
        UUID variantId = UUID.randomUUID();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.initializeInventory(variantId, -5)
        );
        assertTrue(ex.getMessage().contains("negative"));
        verifyNoInteractions(inventoryRecordRepository, inventoryAuditRepository);
    }

    @Test
    @DisplayName("INV-3: reserveInventory moves available quantity to reserved")
    void INV_3_reserve_inventory_success() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord existing = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(10)
                .reservedQuantity(0)
                .soldQuantity(0)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(existing));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord updated = inventoryService.reserveInventory(variantId, 3, "ORD-123", "USER-1");

        assertEquals(7, updated.getAvailableQuantity());
        assertEquals(3, updated.getReservedQuantity());
        verify(inventoryAuditRepository, times(1)).save(any(InventoryAuditEvent.class));
    }

    @Test
    @DisplayName("INV-4: reserveInventory when requested exceeds available throws IllegalArgumentException")
    void INV_4_reserve_inventory_insufficient_stock_fails() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord existing = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(2)
                .reservedQuantity(0)
                .soldQuantity(0)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(existing));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.reserveInventory(variantId, 5, "ORD-456", "USER-2")
        );

        assertTrue(ex.getMessage().contains("Insufficient inventory"));
        verify(inventoryRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("INV-5: reserveInventory auto initializes from variant when record does not exist")
    void INV_5_reserve_inventory_auto_initializes_from_variant() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .stockQuantity(15)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.empty());
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord record = inventoryService.reserveInventory(variantId, 5, "ORD-789", "USER-3");

        assertEquals(10, record.getAvailableQuantity());
        assertEquals(5, record.getReservedQuantity());
    }

    @Test
    @DisplayName("INV-7: releaseReservation restores available stock from reserved")
    void INV_7_release_reservation_success() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord existing = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(5)
                .reservedQuantity(5)
                .soldQuantity(0)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(existing));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord record = inventoryService.releaseReservation(variantId, 2, "ORD-101", "Timeout", "SYSTEM");

        assertEquals(7, record.getAvailableQuantity());
        assertEquals(3, record.getReservedQuantity());
        verify(inventoryAuditRepository, times(1)).save(any(InventoryAuditEvent.class));
    }

    @Test
    @DisplayName("INV-8: releaseReservation exceeding reserved quantity throws IllegalArgumentException")
    void INV_8_release_reservation_exceeding_reserved_fails() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord existing = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(5)
                .reservedQuantity(2)
                .soldQuantity(0)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(existing));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.releaseReservation(variantId, 5, "ORD-102", "Invalid", "SYSTEM")
        );

        assertTrue(ex.getMessage().contains("Cannot release more than reserved"));
    }

    @Test
    @DisplayName("INV-9: confirmPurchase converts reserved stock to sold stock")
    void INV_9_confirm_purchase_success() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord existing = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(5)
                .reservedQuantity(4)
                .soldQuantity(10)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(existing));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord record = inventoryService.confirmPurchase(variantId, 4, "ORD-202", "RAZORPAY");

        assertEquals(5, record.getAvailableQuantity());
        assertEquals(0, record.getReservedQuantity());
        assertEquals(14, record.getSoldQuantity());
        verify(inventoryAuditRepository, times(1)).save(any(InventoryAuditEvent.class));
    }

    @Test
    @DisplayName("INV-10: releaseCancelledOrder restocks available stock from sold or reserved")
    void INV_10_restock_cancelled_order_from_sold_and_reserved() {
        UUID variantId = UUID.randomUUID();
        InventoryRecord recordFromSold = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(5)
                .reservedQuantity(0)
                .soldQuantity(10)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(recordFromSold));
        when(inventoryRecordRepository.save(any(InventoryRecord.class))).thenAnswer(i -> i.getArgument(0));

        InventoryRecord restockedFromSold = inventoryService.releaseCancelledOrder(variantId, 3, "ORD-303", true, "Returned", "ADMIN");
        assertEquals(8, restockedFromSold.getAvailableQuantity());
        assertEquals(7, restockedFromSold.getSoldQuantity());

        InventoryRecord recordFromReserved = InventoryRecord.builder()
                .variantId(variantId)
                .availableQuantity(5)
                .reservedQuantity(4)
                .soldQuantity(7)
                .build();

        when(inventoryRecordRepository.findByVariantIdForUpdate(variantId)).thenReturn(Optional.of(recordFromReserved));
        InventoryRecord restockedFromReserved = inventoryService.releaseCancelledOrder(variantId, 2, "ORD-304", false, "Cancelled before payment", "CUSTOMER");
        assertEquals(7, restockedFromReserved.getAvailableQuantity());
        assertEquals(2, restockedFromReserved.getReservedQuantity());
    }
}
