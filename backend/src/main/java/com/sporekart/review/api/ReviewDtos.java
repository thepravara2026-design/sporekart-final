package com.sporekart.review.api;

import com.sporekart.review.domain.InvitationStatus;
import com.sporekart.review.domain.ReviewStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ReviewDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateReviewRequest {
        @NotNull(message = "Order ID is required")
        private UUID orderId;

        @NotNull(message = "Order Item ID is required")
        private UUID orderItemId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        private Integer rating;

        private String reviewTitle;

        @NotBlank(message = "Review text is required")
        @Size(min = 10, max = 2000, message = "Review text must be between 10 and 2000 characters")
        private String reviewText;

        private List<String> imageUrls;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateReviewRequest {
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        private Integer rating;

        private String reviewTitle;

        @NotBlank(message = "Review text is required")
        @Size(min = 10, max = 2000, message = "Review text must be between 10 and 2000 characters")
        private String reviewText;

        private List<String> imageUrls;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewImageDto {
        private UUID id;
        private String imageUrl;
        private Integer displayOrder;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewResponse {
        private UUID id;
        private UUID productId;
        private String productTitle;
        private String productSlug;
        private String productImageFallback; // Product's primary image used for fallback
        private UUID productVariantId;
        private String variantName;
        private UUID customerId;
        private String customerName;
        private UUID orderId;
        private String orderNumber;
        private UUID orderItemId;
        private Integer rating;
        private String reviewTitle;
        private String reviewText;
        private ReviewStatus status;
        private boolean isVerifiedPurchase;
        private String primaryImageUrl; // First customer image or fallback
        private boolean hasCustomerImages;
        private List<ReviewImageDto> customerImages;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private OffsetDateTime moderatedAt;
        private String moderationReason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductReviewSummary {
        private UUID productId;
        private Double averageRating;
        private long totalReviews;
        private Map<Integer, Long> ratingDistribution; // 1 to 5 star counts
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PendingReviewDto {
        private UUID orderId;
        private String orderNumber;
        private OffsetDateTime orderDate;
        private OffsetDateTime deliveryDate;
        private UUID orderItemId;
        private UUID productId;
        private String productTitle;
        private String productSlug;
        private UUID variantId;
        private String variantName;
        private String productImage;
        private Integer quantity;
        private InvitationStatus invitationStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminModerationRequest {
        @NotNull(message = "Moderation status is required")
        private ReviewStatus status;
        private String moderationReason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminReviewSummary {
        private long totalReviews;
        private long pendingCount;
        private long publishedCount;
        private long hiddenCount;
        private long rejectedCount;
        private Double averageRating;
    }
}
