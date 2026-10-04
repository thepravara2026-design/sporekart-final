package com.sporekart.review.api;

import com.sporekart.review.domain.ReviewStatus;
import com.sporekart.review.application.ProductReviewService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ProductReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewDtos.ReviewResponse>>> getAdminReviews(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ReviewDtos.ReviewResponse> reviews = reviewService.getAdminReviews(status, rating, productId, q, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReviewDtos.AdminReviewSummary>> getAdminReviewSummary() {
        ReviewDtos.AdminReviewSummary summary = reviewService.getAdminReviewSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewDtos.ReviewResponse>> getReviewById(
            @PathVariable("reviewId") UUID reviewId) {
        ReviewDtos.ReviewResponse review = reviewService.getReviewById(reviewId);
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    @PatchMapping("/{reviewId}/status")
    public ResponseEntity<ApiResponse<ReviewDtos.ReviewResponse>> moderateReview(
            Authentication authentication,
            @PathVariable("reviewId") UUID reviewId,
            @Valid @RequestBody ReviewDtos.AdminModerationRequest request) {
        UUID adminId = UUID.fromString(authentication.getName());
        ReviewDtos.ReviewResponse response = reviewService.moderateReview(adminId, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
