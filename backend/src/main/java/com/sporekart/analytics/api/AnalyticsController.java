package com.sporekart.analytics.api;

import com.sporekart.analytics.application.AnalyticsApplicationService;
import com.sporekart.analytics.domain.AnalyticsMetric;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsApplicationService analyticsService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<AnalyticsMetric>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getMetrics()));
    }
}
