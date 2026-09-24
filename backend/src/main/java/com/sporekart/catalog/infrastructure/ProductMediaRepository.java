package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductMediaRepository extends JpaRepository<ProductMedia, UUID> {
    List<ProductMedia> findByProductIdOrderByDisplayOrderAsc(UUID productId);
    List<ProductMedia> findByProductIdInOrderByDisplayOrderAsc(java.util.Collection<UUID> productIds);
    List<ProductMedia> findByVariantId(UUID variantId);
}
