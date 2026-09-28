package com.sporekart.analytics.application;

import com.sporekart.analytics.domain.AnalyticsEvent;
import com.sporekart.analytics.infrastructure.AnalyticsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceUnitTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AnalyticsApplicationService analyticsService;

    private UUID productId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("ANL-1: Track product view publishes ProductViewedEvent")
    void ANL_1_trackProductView() {
        analyticsService.trackProductView(productId, "oyster-mushroom", "Oyster Mushroom", userId);

        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("ANL-2: Get funnel summary aggregates event counts")
    void ANL_2_getFunnelSummary() {
        List<Object[]> mockGroupCounts = List.of(
                new Object[]{"ProductViewed", 100L},
                new Object[]{"AddToCart", 50L},
                new Object[]{"CheckoutStarted", 20L},
                new Object[]{"OrderCreated", 10L},
                new Object[]{"PaymentCaptured", 9L}
        );
        when(analyticsEventRepository.countGroupByEventName()).thenReturn(mockGroupCounts);

        AnalyticsApplicationService.AnalyticsSummaryResponse summary = analyticsService.getFunnelSummary();

        assertNotNull(summary);
        assertEquals(100L, summary.getProductViewedCount());
        assertEquals(50L, summary.getAddToCartCount());
        assertEquals(20L, summary.getCheckoutStartedCount());
        assertEquals(10L, summary.getOrderCreatedCount());
        assertEquals(9L, summary.getPaymentCapturedCount());
        assertEquals(0L, summary.getOrderDeliveredCount());
    }

    @Test
    @DisplayName("ANL-3: Get recent events returns top 50 recent analytics events")
    void ANL_3_getRecentEvents() {
        AnalyticsEvent event = AnalyticsEvent.builder()
                .id(UUID.randomUUID())
                .eventName("ProductViewed")
                .build();
        when(analyticsEventRepository.findTop50ByOrderByCreatedAtDesc()).thenReturn(List.of(event));

        List<AnalyticsEvent> events = analyticsService.getRecentEvents();

        assertEquals(1, events.size());
        assertEquals("ProductViewed", events.get(0).getEventName());
    }
}
