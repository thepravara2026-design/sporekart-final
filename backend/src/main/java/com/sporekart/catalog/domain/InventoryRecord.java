package com.sporekart.catalog.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "variant_id", nullable = false, unique = true)
    private UUID variantId;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Column(name = "sold_quantity", nullable = false)
    private int soldQuantity;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Reservation quantity must be greater than zero");
        }
        if (availableQuantity < quantity) {
            throw new IllegalArgumentException("Insufficient inventory available for reservation. Requested: " + quantity + ", Available: " + availableQuantity);
        }
        availableQuantity -= quantity;
        reservedQuantity += quantity;
    }

    public void release(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Release quantity must be greater than zero");
        }
        if (reservedQuantity < quantity) {
            throw new IllegalArgumentException("Cannot release more than reserved quantity. Reserved: " + reservedQuantity + ", Requested: " + quantity);
        }
        reservedQuantity -= quantity;
        availableQuantity += quantity;
    }

    public void confirmSold(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Purchase confirmation quantity must be greater than zero");
        }
        if (reservedQuantity < quantity) {
            throw new IllegalArgumentException("Cannot confirm sold quantity exceeding reserved quantity. Reserved: " + reservedQuantity + ", Requested: " + quantity);
        }
        reservedQuantity -= quantity;
        soldQuantity += quantity;
    }

    public void restockCancelled(int quantity, boolean fromSold) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be greater than zero");
        }
        if (fromSold) {
            if (soldQuantity < quantity) {
                throw new IllegalArgumentException("Cannot restock more than sold quantity. Sold: " + soldQuantity);
            }
            soldQuantity -= quantity;
        } else {
            if (reservedQuantity < quantity) {
                throw new IllegalArgumentException("Cannot restock more than reserved quantity. Reserved: " + reservedQuantity);
            }
            reservedQuantity -= quantity;
        }
        availableQuantity += quantity;
    }
}
