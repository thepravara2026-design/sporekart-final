package com.sporekart.analytics.application;

import com.sporekart.analytics.domain.AnalyticsEvent;
import com.sporekart.analytics.domain.events.ProductViewedEvent;
import com.sporekart.analytics.infrastructure.AnalyticsEventRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsApplicationService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final ApplicationEventPublisher eventPublisher;

    public void trackProductView(UUID productId, String productSlug, String productTitle, UUID userId) {
        eventPublisher.publishEvent(ProductViewedEvent.builder()
                .productId(productId)
                .productSlug(productSlug)
                .productTitle(productTitle)
                .userId(userId)
                .build());
    }

    public AnalyticsSummaryResponse getFunnelSummary() {
        List<Object[]> rows = analyticsEventRepository.countGroupByEventName();
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((String) row[0], (Long) row[1]);
        }

        return AnalyticsSummaryResponse.builder()
                .productViewedCount(counts.getOrDefault("ProductViewed", 0L))
                .addToCartCount(counts.getOrDefault("AddToCart", 0L))
                .checkoutStartedCount(counts.getOrDefault("CheckoutStarted", 0L))
                .orderCreatedCount(counts.getOrDefault("OrderCreated", 0L))
                .paymentCapturedCount(counts.getOrDefault("PaymentCaptured", 0L))
                .orderDeliveredCount(counts.getOrDefault("OrderDelivered", 0L))
                .enrollmentCreatedCount(counts.getOrDefault("EnrollmentCreated", 0L))
                .enrollmentConfirmedCount(counts.getOrDefault("EnrollmentConfirmed", 0L))
                .build();
    }

    public List<AnalyticsEvent> getRecentEvents() {
        return analyticsEventRepository.findTop50ByOrderByCreatedAtDesc();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsSummaryResponse {
        private long productViewedCount;
        private long addToCartCount;
        private long checkoutStartedCount;
        private long orderCreatedCount;
        private long paymentCapturedCount;
        private long orderDeliveredCount;
        private long enrollmentCreatedCount;
        private long enrollmentConfirmedCount;
    }
}
