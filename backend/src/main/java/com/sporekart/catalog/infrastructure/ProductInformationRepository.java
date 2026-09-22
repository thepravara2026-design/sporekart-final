package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.ProductInformation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductInformationRepository extends JpaRepository<ProductInformation, UUID> {
    Optional<ProductInformation> findByProductId(UUID productId);
}
