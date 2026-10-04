package com.sporekart.review.api;

import com.sporekart.review.application.ProductReviewService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/customer/reviews")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CustomerReviewController {

    private final ProductReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDtos.ReviewResponse>> createReview(
            Authentication authentication,
            @Valid @RequestBody ReviewDtos.CreateReviewRequest request) {
        UUID customerId = UUID.fromString(authentication.getName());
        ReviewDtos.ReviewResponse response = reviewService.createReview(customerId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewDtos.ReviewResponse>>> getCustomerReviews(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID customerId = UUID.fromString(authentication.getName());
        Page<ReviewDtos.ReviewResponse> reviews = reviewService.getCustomerReviews(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ReviewDtos.PendingReviewDto>>> getPendingReviews(
            Authentication authentication) {
        UUID customerId = UUID.fromString(authentication.getName());
        List<ReviewDtos.PendingReviewDto> pending = reviewService.getPendingReviewsForCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @PostMapping("/invitations/{orderItemId}/skip")
    public ResponseEntity<ApiResponse<String>> skipInvitation(
            Authentication authentication,
            @PathVariable("orderItemId") UUID orderItemId) {
        UUID customerId = UUID.fromString(authentication.getName());
        reviewService.skipReviewInvitation(customerId, orderItemId);
        return ResponseEntity.ok(ApiResponse.success("Review invitation skipped successfully"));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewDtos.ReviewResponse>> updateReview(
            Authentication authentication,
            @PathVariable("reviewId") UUID reviewId,
            @Valid @RequestBody ReviewDtos.UpdateReviewRequest request) {
        UUID customerId = UUID.fromString(authentication.getName());
        ReviewDtos.ReviewResponse response = reviewService.updateCustomerReview(customerId, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
