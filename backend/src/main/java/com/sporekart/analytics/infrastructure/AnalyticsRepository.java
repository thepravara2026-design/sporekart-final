package com.sporekart.analytics.infrastructure;

import com.sporekart.analytics.domain.AnalyticsMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AnalyticsRepository extends JpaRepository<AnalyticsMetric, UUID> {
}
