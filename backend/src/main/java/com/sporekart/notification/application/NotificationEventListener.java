package com.sporekart.notification.application;

import com.sporekart.analytics.domain.events.OrderDeliveredEvent;
import com.sporekart.analytics.domain.events.PaymentCapturedEvent;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationEventService notificationEventService;
    private final OrderService orderService;
    private final TrainingService trainingService;
    private final UserRepository userRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleOrderCreated(com.sporekart.analytics.domain.events.OrderCreatedEvent event) {
        if (event.getOrderId() == null) return;
        processOrderConfirmation(event.getOrderId(), "Order Checkout");
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handlePaymentCaptured(PaymentCapturedEvent event) {
        if (event.getOrderId() == null) return;
        processOrderConfirmation(event.getOrderId(), "Razorpay Payment");
    }

    private void processOrderConfirmation(java.util.UUID orderId, String paymentMethod) {
        try {
            OrderResponse order = orderService.getOrderById(orderId);
            if (order == null) return;

            String recipientEmail = null;
            String recipientName = "Valued Customer";

            if (order.getUserId() != null) {
                Optional<User> userOpt = userRepository.findById(order.getUserId());
                if (userOpt.isPresent()) {
                    recipientEmail = userOpt.get().getEmail();
                    recipientName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getFirstName();
                }
            }

            if ((recipientEmail == null || recipientEmail.isBlank()) && order.getShippingAddress() != null) {
                recipientName = order.getShippingAddress().getRecipientName();
            }

            List<Map<String, Object>> itemsList = new ArrayList<>();
            if (order.getItems() != null) {
                for (var item : order.getItems()) {
                    itemsList.add(Map.of(
                            "title", item.getProductTitle() != null ? item.getProductTitle() : "Product",
                            "variant", item.getVariantName() != null ? item.getVariantName() : "",
                            "quantity", item.getQuantity() != null ? item.getQuantity() : 1,
                            "price", item.getLineTotalInr() != null ? item.getLineTotalInr().toString() : "0.00"
                    ));
                }
            }

            String dedupKey = "ORDER_CONFIRMED:" + order.getId();
            notificationEventService.recordEvent(
                    NotificationEventType.ORDER_CONFIRMED,
                    "ORDER",
                    order.getId(),
                    order.getUserId(),
                    recipientEmail,
                    recipientName,
                    "Sporekart Order Confirmation #" + order.getOrderNumber() + " 🍄",
                    Map.of(
                            "orderId", order.getId().toString(),
                            "orderNumber", order.getOrderNumber(),
                            "customerName", recipientName,
                            "totalAmount", order.getTotalAmountInr() != null ? order.getTotalAmountInr().toString() : "0.00",
                            "paymentMethod", paymentMethod,
                            "items", itemsList
                    ),
                    dedupKey
            );
        } catch (Exception e) {
            log.error("Error creating ORDER_CONFIRMED notification event for order {}: {}", orderId, e.getMessage(), e);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleEnrollmentConfirmed(EnrollmentConfirmedEvent event) {
        if (event.getEnrollmentId() == null) return;
        try {
            Enrollment enrollment = trainingService.getEnrollmentById(event.getEnrollmentId());
            if (enrollment == null) return;

            String recipientEmail = null;
            String recipientName = "Trainee";

            if (enrollment.getUserId() != null) {
                Optional<User> userOpt = userRepository.findById(enrollment.getUserId());
                if (userOpt.isPresent()) {
                    recipientEmail = userOpt.get().getEmail();
                    recipientName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getFirstName();
                }
            }

            String courseTitle = enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Masterclass Training";
            String batchCode = enrollment.getBatch() != null ? enrollment.getBatch().getBatchCode() : "UPCOMING";

            String dedupKey = "ENROLLMENT_CONFIRMED:" + enrollment.getId();
            notificationEventService.recordEvent(
                    NotificationEventType.ENROLLMENT_CONFIRMED,
                    "ENROLLMENT",
                    enrollment.getId(),
                    enrollment.getUserId(),
                    recipientEmail,
                    recipientName,
                    "Masterclass Enrollment Confirmed: " + courseTitle + " 🎓",
                    Map.of(
                            "enrollmentId", enrollment.getId().toString(),
                            "studentName", recipientName,
                            "courseTitle", courseTitle,
                            "batchCode", batchCode,
                            "fee", enrollment.getFeePaidInr() != null ? enrollment.getFeePaidInr().toString() : "0.00"
                    ),
                    dedupKey
            );
        } catch (Exception e) {
            log.error("Error creating ENROLLMENT_CONFIRMED notification event for enrollment {}: {}", event.getEnrollmentId(), e.getMessage(), e);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleOrderDelivered(OrderDeliveredEvent event) {
        if (event.getOrderId() == null) return;
        try {
            OrderResponse order = orderService.getOrderById(event.getOrderId());
            if (order == null) return;

            String recipientEmail = null;
            String recipientName = "Valued Customer";

            if (order.getUserId() != null) {
                Optional<User> userOpt = userRepository.findById(order.getUserId());
                if (userOpt.isPresent()) {
                    recipientEmail = userOpt.get().getEmail();
                    recipientName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getFirstName();
                }
            }

            String dedupKey = "ORDER_DELIVERED:" + order.getId();
            notificationEventService.recordEvent(
                    NotificationEventType.ORDER_DELIVERED,
                    "ORDER",
                    order.getId(),
                    order.getUserId(),
                    recipientEmail,
                    recipientName,
                    "Your Sporekart Order #" + order.getOrderNumber() + " Has Been Delivered 🎉",
                    Map.of(
                            "orderId", order.getId().toString(),
                            "orderNumber", order.getOrderNumber(),
                            "customerName", recipientName
                    ),
                    dedupKey
            );
        } catch (Exception e) {
            log.error("Error creating ORDER_DELIVERED notification event for order {}: {}", event.getOrderId(), e.getMessage(), e);
        }
    }
}
