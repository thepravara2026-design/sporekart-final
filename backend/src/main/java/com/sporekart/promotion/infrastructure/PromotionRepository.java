package com.sporekart.promotion.infrastructure;

import com.sporekart.promotion.domain.Promotion;
import com.sporekart.promotion.domain.PromotionStatus;
import com.sporekart.promotion.domain.PromotionTargetAudience;
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
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {
    Optional<Promotion> findByCode(String code);
    boolean existsByCode(String code);
    List<Promotion> findByStatus(PromotionStatus status);

    @Query("SELECT p FROM Promotion p WHERE p.status = :status AND (p.targetAudience = :audience OR p.targetAudience = com.sporekart.promotion.domain.PromotionTargetAudience.BOTH)")
    List<Promotion> findActiveByAudience(@Param("status") PromotionStatus status, @Param("audience") PromotionTargetAudience audience);

    @Query("SELECT p FROM Promotion p WHERE (:status IS NULL OR p.status = :status) " +
           "AND (:audience IS NULL OR p.targetAudience = :audience) " +
           "AND (:query IS NULL OR :query = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Promotion> searchPromotions(@Param("status") PromotionStatus status,
                                     @Param("audience") PromotionTargetAudience audience,
                                     @Param("query") String query,
                                     Pageable pageable);
}
