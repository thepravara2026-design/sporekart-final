package com.sporekart.review.api;

import com.sporekart.review.application.ProductReviewService;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PublicReviewController {

    private final ProductReviewService reviewService;

    @GetMapping("/reviews/latest")
    public ResponseEntity<ApiResponse<List<ReviewDtos.ReviewResponse>>> getLatestReviews(
            @RequestParam(defaultValue = "5") int limit) {
        List<ReviewDtos.ReviewResponse> reviews = reviewService.getLatestPublishedReviews(limit);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewDtos.ReviewResponse>>> getAllPublishedReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewDtos.ReviewResponse> reviews = reviewService.getAllPublishedReviews(page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewDtos.ReviewResponse>>> getProductReviews(
            @PathVariable("productId") UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewDtos.ReviewResponse> reviews = reviewService.getProductReviews(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/products/{productId}/reviews/summary")
    public ResponseEntity<ApiResponse<ReviewDtos.ProductReviewSummary>> getProductReviewSummary(
            @PathVariable("productId") UUID productId) {
        ReviewDtos.ProductReviewSummary summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
