package com.sporekart.promotion.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "promotion_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "promotion_id", nullable = false)
    private UUID promotionId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "discount_amount_inr", precision = 12, scale = 2)
    private BigDecimal discountAmountInr;

    @CreationTimestamp
    @Column(name = "used_at", nullable = false, updatable = false)
    private OffsetDateTime usedAt;
}
