package com.sporekart.catalog.infrastructure;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    
    List<Product> findByIsActiveTrue();
    List<Product> findByStatusAndIsActiveTrue(ProductStatus status);
    List<Product> findByProductTypeAndIsActiveTrue(ProductType type);

    @Query("SELECT p FROM Product p JOIN p.category c WHERE c.slug = :categorySlug AND p.isActive = true AND p.status = 'ACTIVE'")
    List<Product> findByCategorySlug(@Param("categorySlug") String categorySlug);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.category c " +
           "WHERE p.isActive = true AND p.status = 'ACTIVE' " +
           "AND (:categorySlug IS NULL OR c.slug = :categorySlug) " +
           "AND (:productType IS NULL OR p.productType = :productType) " +
           "AND (:searchQuery IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchQuery, '%')))")
    Page<Product> searchProducts(
            @Param("categorySlug") String categorySlug,
            @Param("productType") ProductType productType,
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );
}
