package com.sporekart.promotion.api;

import com.sporekart.promotion.application.PromotionService;
import com.sporekart.promotion.domain.Promotion;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.Batch;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.sporekart.promotion.domain.PromotionTargetAudience;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class CustomerPromotionController {

    private final PromotionService promotionService;
    private final TrainingService trainingService;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Promotion>>> getAvailablePromotions(
            @RequestParam(required = false) PromotionTargetAudience audience) {
        List<Promotion> activePromotions = promotionService.getActivePromotions(audience);
        return ResponseEntity.ok(ApiResponse.success(activePromotions));
    }

    @PostMapping("/validate-batch")
    public ResponseEntity<ApiResponse<PromotionDtos.PromotionValidationResult>> validateBatchPromotion(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody PromotionDtos.BatchPromotionValidationRequest request) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (Exception ignored) {}
        }

        BigDecimal originalFee = BigDecimal.ZERO;
        if (request.getBatchId() != null) {
            Batch batch = trainingService.getBatchById(request.getBatchId());
            if (batch != null && batch.getCourse() != null && batch.getCourse().getFeeInr() != null) {
                originalFee = batch.getCourse().getFeeInr();
            }
        }

        PromotionDtos.PromotionValidationResult result = promotionService.validateAndCalculateForBatch(
                request.getCode(),
                userId,
                request.getBatchId(),
                request.getCourseId(),
                originalFee
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
