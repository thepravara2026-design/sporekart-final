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

    Page<NotificationEvent> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(UUID userId);

    Page<NotificationEvent> findByIsAdminNotificationTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<NotificationEvent> findByIsAdminNotificationTrueAndIsReadFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByIsAdminNotificationTrueAndIsReadFalse();

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE NotificationEvent n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") UUID userId, @Param("readAt") java.time.ZonedDateTime readAt);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE NotificationEvent n SET n.isRead = true, n.readAt = :readAt WHERE n.isAdminNotification = true AND n.isRead = false")
    int markAllAsReadForAdmin(@Param("readAt") java.time.ZonedDateTime readAt);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM NotificationEvent n WHERE n.status = :status AND n.sentAt < :cutoff")
    int deleteByStatusAndSentAtBefore(@Param("status") NotificationStatus status, @Param("cutoff") java.time.ZonedDateTime cutoff);

    @Query("SELECT n FROM NotificationEvent n WHERE " +
           "(:eventType IS NULL OR n.eventType = :eventType) AND " +
           "(:status IS NULL OR n.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(n.recipientEmail) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR " +
           "LOWER(n.subject) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR " +
           "LOWER(n.deduplicationKey) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%'))")
    Page<NotificationEvent> findAllFiltered(
            @Param("eventType") NotificationEventType eventType,
            @Param("status") NotificationStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
