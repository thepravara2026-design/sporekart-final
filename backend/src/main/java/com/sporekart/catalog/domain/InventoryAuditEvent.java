package com.sporekart.catalog.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_audit_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private InventoryEventType eventType;

    @Column(name = "quantity_changed", nullable = false)
    private int quantityChanged;

    @Column(name = "available_quantity_after", nullable = false)
    private int availableQuantityAfter;

    @Column(name = "reserved_quantity_after", nullable = false)
    private int reservedQuantityAfter;

    @Column(name = "sold_quantity_after", nullable = false)
    private int soldQuantityAfter;

    @Column(name = "reference_id")
    private String referenceId;

    private String reason;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
