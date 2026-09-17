package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.InventoryAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryAuditRepository extends JpaRepository<InventoryAuditEvent, UUID> {
    List<InventoryAuditEvent> findByVariantIdOrderByCreatedAtDesc(UUID variantId);
    List<InventoryAuditEvent> findByReferenceId(String referenceId);
}
