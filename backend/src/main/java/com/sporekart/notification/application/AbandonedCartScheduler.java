package com.sporekart.notification.application;

import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartStatus;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.domain.EnrollmentStatus;
import com.sporekart.training.infrastructure.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AbandonedCartScheduler {

    private final CartRepository cartRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationEventService notificationEventService;

    @Scheduled(cron = "0 */15 * * * *") // Every 15 minutes
    public void scanAbandonedCartsAndCheckouts() {
        log.info("Scanning for abandoned carts and incomplete checkouts...");
        scanAbandonedCarts();
        scanAbandonedEnrollments();
    }

    private void scanAbandonedCarts() {
        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
        List<Cart> activeCarts;
        try {
            activeCarts = cartRepository.findAbandonedCartsWithItems(CartStatus.ACTIVE, oneHourAgo);
        } catch (Exception e) {
            log.warn("Failed to query abandoned carts with items, falling back to basic query: {}", e.getMessage());
            activeCarts = cartRepository.findByStatusAndUpdatedAtBefore(CartStatus.ACTIVE, oneHourAgo).stream()
                    .filter(c -> c.getUserId() != null)
                    .toList();
        }

        if (activeCarts.isEmpty()) {
            return;
        }

        // Batch query all users to eliminate N+1 database lookups
        Set<UUID> userIds = activeCarts.stream()
                .map(Cart::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity(), (u1, u2) -> u1));

        for (Cart cart : activeCarts) {
            try {
                if (cart.getUserId() == null || cart.getItems() == null || cart.getItems().isEmpty()) {
                    continue;
                }

                User user = userMap.get(cart.getUserId());
                if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                    continue;
                }

                String dateKey = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String dedupKey = "CART_ABANDONED:" + cart.getId() + ":" + dateKey;

                int itemCount = cart.getItems().stream().mapToInt(i -> i.getQuantity()).sum();

                notificationEventService.recordEvent(
                        NotificationEventType.CART_ABANDONED,
                        "CART",
                        cart.getId(),
                        user.getId(),
                        user.getEmail(),
                        user.getFullName() != null ? user.getFullName() : user.getFirstName(),
                        "Your Sporekart Mushroom Cultivation Cart Is Waiting 🛒",
                        Map.of(
                                "customerName", user.getFirstName() != null ? user.getFirstName() : "Grower",
                                "itemCount", String.valueOf(itemCount),
                                "cartId", cart.getId().toString()
                        ),
                        dedupKey
                );
            } catch (Exception e) {
                log.error("Failed to process abandoned cart notification for cart {}: {}", cart.getId(), e.getMessage(), e);
            }
        }
    }

    private void scanAbandonedEnrollments() {
        ZonedDateTime oneHourAgo = ZonedDateTime.now().minusHours(1);
        List<Enrollment> pendingEnrollments;
        try {
            pendingEnrollments = enrollmentRepository.findByStatusAndEnrolledAtBefore(EnrollmentStatus.PENDING_PAYMENT, oneHourAgo);
        } catch (Exception e) {
            log.warn("Failed to query pending enrollments, falling back to stream filter: {}", e.getMessage());
            pendingEnrollments = enrollmentRepository.findAllByOrderByEnrolledAtDesc().stream()
                    .filter(e2 -> e2.getStatus() == EnrollmentStatus.PENDING_PAYMENT && e2.getUserId() != null)
                    .filter(e2 -> e2.getEnrolledAt() != null && e2.getEnrolledAt().isBefore(oneHourAgo))
                    .toList();
        }

        if (pendingEnrollments.isEmpty()) {
            return;
        }

        // Batch query all users to eliminate N+1 database lookups
        Set<UUID> userIds = pendingEnrollments.stream()
                .map(Enrollment::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity(), (u1, u2) -> u1));

        for (Enrollment enrollment : pendingEnrollments) {
            try {
                if (enrollment.getUserId() == null) {
                    continue;
                }

                User user = userMap.get(enrollment.getUserId());
                if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                    continue;
                }

                String dateKey = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String dedupKey = "ENROLLMENT_ABANDONED:" + enrollment.getId() + ":" + dateKey;
                String courseTitle = enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Masterclass Training";

                notificationEventService.recordEvent(
                        NotificationEventType.ENROLLMENT_CHECKOUT_ABANDONED,
                        "ENROLLMENT",
                        enrollment.getId(),
                        user.getId(),
                        user.getEmail(),
                        user.getFullName() != null ? user.getFullName() : user.getFirstName(),
                        "Complete Your Masterclass Training Enrollment 🎓",
                        Map.of(
                                "studentName", user.getFirstName() != null ? user.getFirstName() : "Trainee",
                                "courseTitle", courseTitle,
                                "enrollmentId", enrollment.getId().toString()
                        ),
                        dedupKey
                );
            } catch (Exception e) {
                log.error("Failed to process abandoned enrollment notification for enrollment {}: {}", enrollment.getId(), e.getMessage(), e);
            }
        }
    }
}
