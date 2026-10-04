package com.sporekart.review.application;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductMedia;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderItem;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.review.api.ReviewDtos;
import com.sporekart.review.domain.*;
import com.sporekart.review.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductReviewImageRepository imageRepository;
    private final ReviewInvitationStateRepository invitationStateRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewDtos.ReviewResponse createReview(UUID customerId, ReviewDtos.CreateReviewRequest request) {
        if (customerId == null) {
            throw new IllegalArgumentException("User must be authenticated to submit a review.");
        }

        // 1. Verify Order Ownership & Existence
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + request.getOrderId()));

        if (!customerId.equals(order.getUserId())) {
            throw new IllegalStateException("You can only review products from your own orders.");
        }

        // 2. Verify Order Delivery Status
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Product reviews can only be submitted after the order has been DELIVERED.");
        }

        // 3. Find Matching Order Item
        OrderItem orderItem = order.getItems().stream()
                .filter(item -> item.getId().equals(request.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order item not found in specified order."));

        // 4. Determine Product & Variant
        UUID variantId = orderItem.getVariantId();
        UUID productId = null;
        if (variantId != null) {
            ProductVariant variant = variantRepository.findById(variantId).orElse(null);
            if (variant != null && variant.getProduct() != null) {
                productId = variant.getProduct().getId();
            }
        }

        if (productId == null) {
            throw new IllegalArgumentException("Associated product could not be resolved for this order item.");
        }

        // 5. Prevent Duplicate Reviews
        if (reviewRepository.existsByCustomerIdAndOrderItemId(customerId, request.getOrderItemId())) {
            throw new IllegalStateException("You have already submitted a review for this delivered order item.");
        }

        // 6. Validate Rating & Text
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars.");
        }

        String sanitizedTitle = request.getReviewTitle() != null ? HtmlUtils.htmlEscape(request.getReviewTitle().trim()) : "";
        String sanitizedText = HtmlUtils.htmlEscape(request.getReviewText().trim());

        // 7. Build ProductReview Entity
        ProductReview review = ProductReview.builder()
                .productId(productId)
                .productVariantId(variantId)
                .customerId(customerId)
                .orderId(order.getId())
                .orderItemId(orderItem.getId())
                .rating(request.getRating())
                .reviewTitle(sanitizedTitle)
                .reviewText(sanitizedText)
                .status(ReviewStatus.PUBLISHED) // Default published
                .isVerifiedPurchase(true)
                .build();

        // 8. Attach Customer Uploaded Images (up to 5)
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<String> validUrls = request.getImageUrls().stream()
                    .filter(url -> url != null && !url.isBlank())
                    .limit(5)
                    .toList();

            for (int i = 0; i < validUrls.size(); i++) {
                ProductReviewImage img = ProductReviewImage.builder()
                        .imageUrl(validUrls.get(i))
                        .displayOrder(i)
                        .build();
                review.addImage(img);
            }
        }

        ProductReview savedReview = reviewRepository.save(review);

        // 9. Update Invitation State
        ReviewInvitationState invitation = invitationStateRepository
                .findByCustomerIdAndOrderItemId(customerId, orderItem.getId())
                .orElse(ReviewInvitationState.builder()
                        .customerId(customerId)
                        .orderId(order.getId())
                        .orderItemId(orderItem.getId())
                        .build());

        invitation.setInvitationStatus(InvitationStatus.COMPLETED);
        invitation.setReviewedAt(OffsetDateTime.now());
        invitationStateRepository.save(invitation);

        return mapToReviewResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDtos.ReviewResponse> getProductReviews(UUID productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductReview> reviewPage = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.PUBLISHED, pageable);
        return reviewPage.map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public ReviewDtos.ProductReviewSummary getProductReviewSummary(UUID productId) {
        long totalReviews = reviewRepository.countByProductIdAndStatus(productId, ReviewStatus.PUBLISHED);
        Double avgRating = reviewRepository.calculateAverageRatingByProductIdAndStatus(productId, ReviewStatus.PUBLISHED);

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        List<Object[]> rawDist = reviewRepository.getRatingDistributionByProductIdAndStatus(productId, ReviewStatus.PUBLISHED);
        for (Object[] row : rawDist) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            if (rating != null) {
                distribution.put(rating, count);
            }
        }

        double roundedAvg = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0;

        return ReviewDtos.ProductReviewSummary.builder()
                .productId(productId)
                .averageRating(roundedAvg)
                .totalReviews(totalReviews)
                .ratingDistribution(distribution)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ReviewDtos.ReviewResponse> getLatestPublishedReviews(int limit) {
        int fetchLimit = limit > 0 ? limit : 5;
        Pageable pageable = PageRequest.of(0, fetchLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<ProductReview> reviews = reviewRepository.findLatestPublishedReviews(ReviewStatus.PUBLISHED, pageable);

        return reviews.stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ReviewDtos.ReviewResponse> getAllPublishedReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductReview> reviewPage = reviewRepository.findByStatus(ReviewStatus.PUBLISHED, pageable);
        return reviewPage.map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDtos.ReviewResponse> getCustomerReviews(UUID customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductReview> reviewPage = reviewRepository.findByCustomerId(customerId, pageable);
        return reviewPage.map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public List<ReviewDtos.PendingReviewDto> getPendingReviewsForCustomer(UUID customerId) {
        List<Order> customerOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(customerId);

        List<ReviewDtos.PendingReviewDto> pendingList = new ArrayList<>();

        for (Order order : customerOrders) {
            if (order.getStatus() != OrderStatus.DELIVERED) {
                continue;
            }

            for (OrderItem item : order.getItems()) {
                // Check if already reviewed
                if (reviewRepository.existsByCustomerIdAndOrderItemId(customerId, item.getId())) {
                    continue;
                }

                // Check invitation state
                Optional<ReviewInvitationState> stateOpt = invitationStateRepository.findByCustomerIdAndOrderItemId(customerId, item.getId());
                InvitationStatus invStatus = stateOpt.map(ReviewInvitationState::getInvitationStatus).orElse(InvitationStatus.PENDING);

                if (invStatus == InvitationStatus.COMPLETED) {
                    continue;
                }

                // Resolve Product details
                UUID variantId = item.getVariantId();
                Product product = null;
                if (variantId != null) {
                    ProductVariant variant = variantRepository.findById(variantId).orElse(null);
                    if (variant != null) {
                        product = variant.getProduct();
                    }
                }

                String productSlug = product != null ? product.getSlug() : "";
                String productImage = getProductPrimaryImage(product);

                pendingList.add(ReviewDtos.PendingReviewDto.builder()
                        .orderId(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .orderDate(order.getCreatedAt())
                        .deliveryDate(order.getUpdatedAt())
                        .orderItemId(item.getId())
                        .productId(product != null ? product.getId() : null)
                        .productTitle(item.getProductTitle())
                        .productSlug(productSlug)
                        .variantId(variantId)
                        .variantName(item.getVariantName())
                        .productImage(productImage)
                        .quantity(item.getQuantity())
                        .invitationStatus(invStatus)
                        .build());
            }
        }

        return pendingList;
    }

    @Transactional
    public void skipReviewInvitation(UUID customerId, UUID orderItemId) {
        OrderItem item = orderRepository.findAll().stream()
                .flatMap(o -> o.getItems().stream())
                .filter(i -> i.getId().equals(orderItemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order item not found: " + orderItemId));

        Order order = item.getOrder();
        if (!customerId.equals(order.getUserId())) {
            throw new IllegalStateException("Unauthorized access to order item invitation.");
        }

        ReviewInvitationState invitation = invitationStateRepository
                .findByCustomerIdAndOrderItemId(customerId, orderItemId)
                .orElse(ReviewInvitationState.builder()
                        .customerId(customerId)
                        .orderId(order.getId())
                        .orderItemId(orderItemId)
                        .build());

        invitation.setInvitationStatus(InvitationStatus.SKIPPED);
        invitation.setDismissedAt(OffsetDateTime.now());
        invitationStateRepository.save(invitation);
    }

    @Transactional
    public ReviewDtos.ReviewResponse updateCustomerReview(UUID customerId, UUID reviewId, ReviewDtos.UpdateReviewRequest request) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        if (!customerId.equals(review.getCustomerId())) {
            throw new IllegalStateException("You can only edit your own reviews.");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars.");
        }

        review.setRating(request.getRating());
        if (request.getReviewTitle() != null) {
            review.setReviewTitle(HtmlUtils.htmlEscape(request.getReviewTitle().trim()));
        }
        review.setReviewText(HtmlUtils.htmlEscape(request.getReviewText().trim()));

        // Update Images
        if (request.getImageUrls() != null) {
            review.getImages().clear();
            List<String> validUrls = request.getImageUrls().stream()
                    .filter(url -> url != null && !url.isBlank())
                    .limit(5)
                    .toList();

            for (int i = 0; i < validUrls.size(); i++) {
                ProductReviewImage img = ProductReviewImage.builder()
                        .imageUrl(validUrls.get(i))
                        .displayOrder(i)
                        .build();
                review.addImage(img);
            }
        }

        ProductReview updated = reviewRepository.save(review);
        return mapToReviewResponse(updated);
    }

    // --- Admin Moderation Operations ---

    @Transactional(readOnly = true)
    public Page<ReviewDtos.ReviewResponse> getAdminReviews(
            ReviewStatus status,
            Integer rating,
            UUID productId,
            String query,
            int page,
            int size) {

        Specification<ProductReview> spec = (root, q, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }

            if (productId != null) {
                predicates.add(cb.equal(root.get("productId"), productId));
            }

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("reviewText")), pattern),
                        cb.like(cb.lower(root.get("reviewTitle")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductReview> reviewPage = reviewRepository.findAll(spec, pageable);
        return reviewPage.map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public ReviewDtos.AdminReviewSummary getAdminReviewSummary() {
        long total = reviewRepository.count();
        long pending = reviewRepository.countByStatus(ReviewStatus.PENDING);
        long published = reviewRepository.countByStatus(ReviewStatus.PUBLISHED);
        long hidden = reviewRepository.countByStatus(ReviewStatus.HIDDEN);
        long rejected = reviewRepository.countByStatus(ReviewStatus.REJECTED);

        Double avg = reviewRepository.calculateAverageRatingByProductIdAndStatus(null, ReviewStatus.PUBLISHED);

        return ReviewDtos.AdminReviewSummary.builder()
                .totalReviews(total)
                .pendingCount(pending)
                .publishedCount(published)
                .hiddenCount(hidden)
                .rejectedCount(rejected)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .build();
    }

    @Transactional
    public ReviewDtos.ReviewResponse moderateReview(UUID adminId, UUID reviewId, ReviewDtos.AdminModerationRequest request) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        review.setStatus(request.getStatus());
        review.setModeratedAt(OffsetDateTime.now());
        review.setModeratedBy(adminId);
        review.setModerationReason(request.getModerationReason());

        ProductReview updated = reviewRepository.save(review);
        return mapToReviewResponse(updated);
    }

    @Transactional(readOnly = true)
    public ReviewDtos.ReviewResponse getReviewById(UUID reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        return mapToReviewResponse(review);
    }

    // --- Helper Mappers ---

    public ReviewDtos.ReviewResponse mapToReviewResponse(ProductReview review) {
        Product product = productRepository.findById(review.getProductId()).orElse(null);
        ProductVariant variant = review.getProductVariantId() != null ?
                variantRepository.findById(review.getProductVariantId()).orElse(null) : null;
        User customer = userRepository.findById(review.getCustomerId()).orElse(null);
        Order order = orderRepository.findById(review.getOrderId()).orElse(null);

        String productTitle = product != null ? product.getTitle() : "Sporekart Product";
        String productSlug = product != null ? product.getSlug() : "";
        String fallbackImage = getProductPrimaryImage(product);

        String customerName = "Verified Customer";
        if (customer != null && customer.getFullName() != null && !customer.getFullName().isBlank()) {
            customerName = formatCustomerDisplayName(customer.getFullName());
        }

        List<ReviewDtos.ReviewImageDto> imageDtos = review.getImages().stream()
                .map(img -> ReviewDtos.ReviewImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        boolean hasCustomerImages = !imageDtos.isEmpty();
        String primaryImageUrl = hasCustomerImages ? imageDtos.get(0).getImageUrl() : fallbackImage;

        return ReviewDtos.ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .productTitle(productTitle)
                .productSlug(productSlug)
                .productImageFallback(fallbackImage)
                .productVariantId(review.getProductVariantId())
                .variantName(variant != null ? variant.getVariantName() : "")
                .customerId(review.getCustomerId())
                .customerName(customerName)
                .orderId(review.getOrderId())
                .orderNumber(order != null ? order.getOrderNumber() : "")
                .orderItemId(review.getOrderItemId())
                .rating(review.getRating())
                .reviewTitle(review.getReviewTitle())
                .reviewText(review.getReviewText())
                .status(review.getStatus())
                .isVerifiedPurchase(review.isVerifiedPurchase())
                .primaryImageUrl(primaryImageUrl)
                .hasCustomerImages(hasCustomerImages)
                .customerImages(imageDtos)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .moderatedAt(review.getModeratedAt())
                .moderationReason(review.getModerationReason())
                .build();
    }

    private String getProductPrimaryImage(Product product) {
        if (product == null || product.getMedia() == null || product.getMedia().isEmpty()) {
            return "/images/placeholder-product.jpg";
        }
        for (ProductMedia media : product.getMedia()) {
            if (media.isPrimary()) {
                return media.getMediaUrl();
            }
        }
        return product.getMedia().get(0).getMediaUrl();
    }

    private String formatCustomerDisplayName(String fullName) {
        String trimmed = fullName.trim();
        String[] parts = trimmed.split("\\s+");
        if (parts.length == 1) {
            return parts[0];
        }
        String firstName = parts[0];
        String lastInitial = parts[parts.length - 1].substring(0, 1).toUpperCase();
        return firstName + " " + lastInitial + ".";
    }
}
