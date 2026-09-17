package com.sporekart.analytics.infrastructure;

import com.sporekart.analytics.domain.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {
    long countByEventName(String eventName);

    @Query("SELECT e.eventName, COUNT(e) FROM AnalyticsEvent e GROUP BY e.eventName")
    List<Object[]> countGroupByEventName();

    List<AnalyticsEvent> findTop50ByOrderByCreatedAtDesc();
}
