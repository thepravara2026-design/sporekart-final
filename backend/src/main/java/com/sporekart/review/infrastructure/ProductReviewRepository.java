package com.sporekart.review.infrastructure;

import com.sporekart.review.domain.ProductReview;
import com.sporekart.review.domain.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID>, JpaSpecificationExecutor<ProductReview> {

    Optional<ProductReview> findByCustomerIdAndOrderItemId(UUID customerId, UUID orderItemId);

    boolean existsByCustomerIdAndOrderItemId(UUID customerId, UUID orderItemId);

    Page<ProductReview> findByProductIdAndStatus(UUID productId, ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByStatus(ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByCustomerId(UUID customerId, Pageable pageable);

    List<ProductReview> findTop5ByStatusOrderByCreatedAtDesc(ReviewStatus status);

    @Query("SELECT r FROM ProductReview r WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<ProductReview> findLatestPublishedReviews(@Param("status") ReviewStatus status, Pageable pageable);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.productId = :productId AND r.status = :status")
    long countByProductIdAndStatus(@Param("productId") UUID productId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(CAST(r.rating AS double)) FROM ProductReview r WHERE r.productId = :productId AND r.status = :status")
    Double calculateAverageRatingByProductIdAndStatus(@Param("productId") UUID productId, @Param("status") ReviewStatus status);

    @Query("SELECT r.rating, COUNT(r) FROM ProductReview r WHERE r.productId = :productId AND r.status = :status GROUP BY r.rating")
    List<Object[]> getRatingDistributionByProductIdAndStatus(@Param("productId") UUID productId, @Param("status") ReviewStatus status);

    @Query("""
        SELECT r.productId, AVG(CAST(r.rating AS double)), COUNT(r), SUM(CASE WHEN r.isVerifiedPurchase = true THEN 1 ELSE 0 END)
        FROM ProductReview r
        WHERE r.status = :status
        GROUP BY r.productId
    """)
    List<Object[]> findReviewStatsGroupedByProduct(@Param("status") ReviewStatus status);

    long countByStatus(ReviewStatus status);
}
