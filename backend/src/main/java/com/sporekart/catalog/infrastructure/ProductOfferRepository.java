package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.ProductOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductOfferRepository extends JpaRepository<ProductOffer, UUID> {
    List<ProductOffer> findByProductIdAndIsActiveTrue(UUID productId);
    List<ProductOffer> findByProductId(UUID productId);
}
