package com.sporekart.notification.infrastructure;

import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.notification.domain.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, UUID> {

    Optional<NotificationEvent> findByDeduplicationKey(String deduplicationKey);

    List<NotificationEvent> findTop20ByStatusInAndAttemptCountLessThanOrderByCreatedAtAsc(
            List<NotificationStatus> statuses, int maxAttempts
    );

    Page<NotificationEvent> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT n FROM NotificationEvent n WHERE " +
           "(:eventType IS NULL OR n.eventType = :eventType) AND " +
           "(:status IS NULL OR n.status = :status) AND " +
           "(:search IS NULL OR LOWER(n.recipientEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(n.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(n.deduplicationKey) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<NotificationEvent> findAllFiltered(
            @Param("eventType") NotificationEventType eventType,
            @Param("status") NotificationStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
