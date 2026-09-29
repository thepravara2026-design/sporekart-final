package com.sporekart.promotion.api;

import com.sporekart.promotion.application.PromotionService;
import com.sporekart.promotion.domain.Promotion;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class CustomerPromotionController {

    private final PromotionService promotionService;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Promotion>>> getAvailablePromotions() {
        List<Promotion> activePromotions = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success(activePromotions));
    }
}
