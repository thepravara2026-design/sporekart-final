package com.sporekart.promotion.api;

import com.sporekart.promotion.application.PromotionService;
import com.sporekart.promotion.domain.Promotion;
import com.sporekart.promotion.domain.PromotionStatus;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/promotions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Promotion>>> getPromotions(
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Promotion> promotions = promotionService.getAllPromotions(status, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(promotions));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Promotion>> createPromotion(@Valid @RequestBody PromotionDtos.CreatePromotionRequest request) {
        Promotion promotion = promotionService.createPromotion(request);
        return ResponseEntity.ok(ApiResponse.success(promotion));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Promotion>> updatePromotion(
            @PathVariable("id") UUID id,
            @Valid @RequestBody PromotionDtos.CreatePromotionRequest request) {
        Promotion promotion = promotionService.updatePromotion(id, request);
        return ResponseEntity.ok(ApiResponse.success(promotion));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Promotion>> toggleStatus(
            @PathVariable("id") UUID id,
            @RequestParam PromotionStatus status) {
        Promotion promotion = promotionService.toggleStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(promotion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable("id") UUID id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
