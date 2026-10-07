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
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    @Transactional
    public void scanAbandonedCartsAndCheckouts() {
        log.info("Scanning for abandoned carts and incomplete checkouts...");
        scanAbandonedCarts();
        scanAbandonedEnrollments();
    }

    private void scanAbandonedCarts() {
        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
        List<Cart> activeCarts = cartRepository.findAll().stream()
                .filter(c -> c.getStatus() == CartStatus.ACTIVE && c.getUserId() != null && !c.getItems().isEmpty())
                .filter(c -> c.getUpdatedAt() != null && c.getUpdatedAt().isBefore(oneHourAgo))
                .toList();

        for (Cart cart : activeCarts) {
            Optional<User> userOpt = userRepository.findById(cart.getUserId());
            if (userOpt.isEmpty() || userOpt.get().getEmail() == null || userOpt.get().getEmail().isBlank()) {
                continue;
            }

            User user = userOpt.get();
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
        }
    }

    private void scanAbandonedEnrollments() {
        ZonedDateTime oneHourAgo = ZonedDateTime.now().minusHours(1);
        List<Enrollment> pendingEnrollments = enrollmentRepository.findAll().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.PENDING_PAYMENT && e.getUserId() != null)
                .filter(e -> e.getEnrolledAt() != null && e.getEnrolledAt().isBefore(oneHourAgo))
                .toList();

        for (Enrollment enrollment : pendingEnrollments) {
            Optional<User> userOpt = userRepository.findById(enrollment.getUserId());
            if (userOpt.isEmpty() || userOpt.get().getEmail() == null || userOpt.get().getEmail().isBlank()) {
                continue;
            }

            User user = userOpt.get();
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
        }
    }
}
