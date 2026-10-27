package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ProductVariant pv SET pv.stockQuantity = :stockQuantity WHERE pv.id = :id")
    void updateStockQuantity(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("stockQuantity") int stockQuantity);
}
