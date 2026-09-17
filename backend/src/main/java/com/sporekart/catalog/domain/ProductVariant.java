package com.sporekart.catalog.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "variant_name", nullable = false)
    private String variantName;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(name = "price_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceInr;

    @Column(name = "compare_at_price_inr", precision = 10, scale = 2)
    private BigDecimal compareAtPriceInr;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        validatePricing();
    }

    @PreUpdate
    protected void onUpdate() {
        validatePricing();
    }

    public void validatePricing() {
        if (priceInr == null || priceInr.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Variant price cannot be null or negative");
        }
        if (compareAtPriceInr != null && compareAtPriceInr.compareTo(priceInr) < 0) {
            throw new IllegalArgumentException("Compare at price (MRP) cannot be less than selling price");
        }
    }
}
