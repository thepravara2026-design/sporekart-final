package com.sporekart.promotion.api;

import com.sporekart.promotion.domain.PromotionStatus;
import com.sporekart.promotion.domain.PromotionTargetAudience;
import com.sporekart.promotion.domain.PromotionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class PromotionDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePromotionRequest {
        @NotBlank(message = "Promotion name is required")
        private String name;

        @NotBlank(message = "Promo code is required")
        private String code;

        private String description;

        @NotNull(message = "Promotion type is required")
        private PromotionType type;

        private BigDecimal discountValue;
        private BigDecimal maximumDiscount;
        private BigDecimal minimumOrderValue;

        private OffsetDateTime startAt;
        private OffsetDateTime endAt;

        private PromotionStatus status;
        private Integer usageLimit;
        private Integer perCustomerLimit;
        private Boolean stackable;
        private Integer priority;

        private PromotionTargetAudience targetAudience;

        private String targetCategorySlug;
        private UUID targetProductId;
        private String targetType;
        private UUID targetBatchId;
        private UUID targetCourseId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApplyPromotionRequest {
        @NotBlank(message = "Promo code is required")
        private String code;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchPromotionValidationRequest {
        @NotBlank(message = "Promo code is required")
        private String code;
        private UUID batchId;
        private UUID courseId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PromotionValidationResult {
        private boolean valid;
        private String code;
        private String name;
        private PromotionType type;
        private PromotionTargetAudience targetAudience;
        private BigDecimal discountAmountInr;
        private BigDecimal finalAmountInr;
        private boolean isFreeShipping;
        private String message;
    }
}
