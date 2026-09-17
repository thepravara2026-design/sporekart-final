package com.sporekart.analytics.application;

import com.sporekart.analytics.domain.AnalyticsEvent;
import com.sporekart.analytics.domain.events.*;
import com.sporekart.analytics.infrastructure.AnalyticsEventRepository;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventListener {

    private final AnalyticsEventRepository analyticsEventRepository;

    @EventListener
    public void handleProductViewed(ProductViewedEvent event) {
        log.info("Analytics consuming ProductViewed event for product: {}", event.getProductSlug());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("ProductViewed")
                .metricValue(BigDecimal.ONE)
                .userId(event.getUserId())
                .referenceId(event.getProductId() != null ? event.getProductId().toString() : event.getProductSlug())
                .eventDataJson(String.format("{\"productSlug\":\"%s\",\"title\":\"%s\"}", event.getProductSlug(), event.getProductTitle()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleAddToCart(AddToCartEvent event) {
        log.info("Analytics consuming AddToCart event for variant: {}", event.getVariantId());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("AddToCart")
                .metricValue(BigDecimal.valueOf(event.getQuantity()))
                .userId(event.getUserId())
                .referenceId(event.getVariantId() != null ? event.getVariantId().toString() : null)
                .eventDataJson(String.format("{\"quantity\":%d,\"priceInr\":%s}", event.getQuantity(), event.getPriceInr()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleCheckoutStarted(CheckoutStartedEvent event) {
        log.info("Analytics consuming CheckoutStarted event for cart: {}", event.getCartId());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("CheckoutStarted")
                .metricValue(event.getSubtotalInr())
                .userId(event.getUserId())
                .referenceId(event.getCartId() != null ? event.getCartId().toString() : null)
                .eventDataJson(String.format("{\"itemCount\":%d,\"subtotal\":%s}", event.getItemCount(), event.getSubtotalInr()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Analytics consuming OrderCreated event for order: {}", event.getOrderNumber());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("OrderCreated")
                .metricValue(event.getTotalAmountInr())
                .userId(event.getUserId())
                .referenceId(event.getOrderId() != null ? event.getOrderId().toString() : event.getOrderNumber())
                .eventDataJson(String.format("{\"orderNumber\":\"%s\",\"total\":%s}", event.getOrderNumber(), event.getTotalAmountInr()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handlePaymentCaptured(PaymentCapturedEvent event) {
        log.info("Analytics consuming PaymentCaptured event for order: {}", event.getOrderId());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("PaymentCaptured")
                .metricValue(event.getAmountInr())
                .referenceId(event.getPaymentId() != null ? event.getPaymentId().toString() : null)
                .eventDataJson(String.format("{\"orderId\":\"%s\",\"razorpayPaymentId\":\"%s\"}", event.getOrderId(), event.getRazorpayPaymentId()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleOrderDelivered(OrderDeliveredEvent event) {
        log.info("Analytics consuming OrderDelivered event for order: {}", event.getOrderNumber());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("OrderDelivered")
                .metricValue(BigDecimal.ONE)
                .referenceId(event.getOrderId() != null ? event.getOrderId().toString() : event.getOrderNumber())
                .eventDataJson(String.format("{\"orderNumber\":\"%s\"}", event.getOrderNumber()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleEnrollmentCreated(EnrollmentCreatedEvent event) {
        log.info("Analytics consuming EnrollmentCreated event for course: {}", event.getCourseId());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("EnrollmentCreated")
                .metricValue(event.getFeePaidInr())
                .userId(event.getUserId())
                .referenceId(event.getEnrollmentId() != null ? event.getEnrollmentId().toString() : null)
                .eventDataJson(String.format("{\"courseId\":\"%s\",\"feePaid\":%s}", event.getCourseId(), event.getFeePaidInr()))
                .build();
        analyticsEventRepository.save(entity);
    }

    @EventListener
    public void handleEnrollmentConfirmed(EnrollmentConfirmedEvent event) {
        log.info("Analytics consuming EnrollmentConfirmed event for enrollment: {}", event.getEnrollmentId());
        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventName("EnrollmentConfirmed")
                .metricValue(BigDecimal.ONE)
                .userId(event.getUserId())
                .referenceId(event.getEnrollmentId() != null ? event.getEnrollmentId().toString() : null)
                .eventDataJson(String.format("{\"courseTitle\":\"%s\"}", event.getCourseTitle()))
                .build();
        analyticsEventRepository.save(entity);
    }
}
