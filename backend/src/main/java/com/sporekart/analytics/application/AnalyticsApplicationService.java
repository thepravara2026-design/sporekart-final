package com.sporekart.analytics.application;

import com.sporekart.analytics.domain.AnalyticsMetric;
import com.sporekart.analytics.infrastructure.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsApplicationService {

    private final AnalyticsRepository analyticsRepository;

    public void trackEvent(String eventName, Double value) {
        AnalyticsMetric metric = AnalyticsMetric.builder()
                .eventName(eventName)
                .metricValue(value)
                .build();
        analyticsRepository.save(metric);
    }

    public List<AnalyticsMetric> getMetrics() {
        return analyticsRepository.findAll();
    }
}
