package com.sporekart.promotion.infrastructure;

import com.sporekart.promotion.domain.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, UUID> {
    long countByPromotionId(UUID promotionId);
    long countByPromotionIdAndUserId(UUID promotionId, UUID userId);
    List<PromotionUsage> findByPromotionId(UUID promotionId);
}
