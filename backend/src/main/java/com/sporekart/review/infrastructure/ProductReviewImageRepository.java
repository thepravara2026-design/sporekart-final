package com.sporekart.review.infrastructure;

import com.sporekart.review.domain.ProductReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductReviewImageRepository extends JpaRepository<ProductReviewImage, UUID> {
    List<ProductReviewImage> findByReviewIdOrderByDisplayOrderAsc(UUID reviewId);
    void deleteByReviewId(UUID reviewId);
}
