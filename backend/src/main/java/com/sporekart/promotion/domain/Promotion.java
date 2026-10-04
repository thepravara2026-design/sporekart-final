package com.sporekart.promotion.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionType type;

    @Column(name = "discount_value", precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "maximum_discount", precision = 12, scale = 2)
    private BigDecimal maximumDiscount;

    @Column(name = "minimum_order_value", precision = 12, scale = 2)
    private BigDecimal minimumOrderValue;

    @Column(name = "start_at")
    private OffsetDateTime startAt;

    @Column(name = "end_at")
    private OffsetDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionStatus status;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_customer_limit")
    private Integer perCustomerLimit;

    @Builder.Default
    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean stackable = false;

    @Builder.Default
    @Column(nullable = false)
    private Integer priority = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_audience", nullable = false)
    @Builder.Default
    private PromotionTargetAudience targetAudience = PromotionTargetAudience.BOTH;

    @Column(name = "target_category_slug")
    private String targetCategorySlug;

    @Column(name = "target_product_id")
    private UUID targetProductId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_batch_id")
    private UUID targetBatchId;

    @Column(name = "target_course_id")
    private UUID targetCourseId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
