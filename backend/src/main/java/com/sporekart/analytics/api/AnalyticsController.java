package com.sporekart.analytics.api;

import com.sporekart.analytics.application.AnalyticsApplicationService;
import com.sporekart.analytics.domain.AnalyticsEvent;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsApplicationService analyticsService;

    @PostMapping("/track-product-view")
    public ResponseEntity<ApiResponse<String>> trackProductView(
            @Valid @RequestBody TrackProductViewRequest request,
            Authentication authentication
    ) {
        UUID userId = authentication != null ? getUserId(authentication) : null;
        analyticsService.trackProductView(request.getProductId(), request.getProductSlug(), request.getProductTitle(), userId);
        return ResponseEntity.ok(ApiResponse.success("Product view tracked"));
    }

    @GetMapping("/funnel")
    public ResponseEntity<ApiResponse<AnalyticsApplicationService.AnalyticsSummaryResponse>> getFunnelSummary() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getFunnelSummary()));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<AnalyticsEvent>>> getRecentEvents() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRecentEvents()));
    }

    private UUID getUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            return null;
        }
    }

    @Data
    public static class TrackProductViewRequest {
        private UUID productId;
        private String productSlug;
        private String productTitle;
    }
}
