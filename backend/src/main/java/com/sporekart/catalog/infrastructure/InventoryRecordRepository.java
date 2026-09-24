package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.InventoryRecord;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, UUID> {
    Optional<InventoryRecord> findByVariantId(UUID variantId);
    java.util.List<InventoryRecord> findByVariantIdIn(java.util.Collection<UUID> variantIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryRecord i WHERE i.variantId = :variantId")
    Optional<InventoryRecord> findByVariantIdForUpdate(@Param("variantId") UUID variantId);
}
