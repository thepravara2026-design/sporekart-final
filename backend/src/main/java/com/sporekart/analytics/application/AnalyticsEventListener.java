package com.sporekart.analytics.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.analytics.domain.AnalyticsEvent;
import com.sporekart.analytics.domain.events.*;
import com.sporekart.analytics.infrastructure.AnalyticsEventRepository;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Slf4j
public class AnalyticsEventListener {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public AnalyticsEventListener(
            AnalyticsEventRepository analyticsEventRepository,
            ObjectMapper objectMapper) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    private String createJson(Object... keyValues) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();
            for (int i = 0; i < keyValues.length; i += 2) {
                if (i + 1 < keyValues.length && keyValues[i] != null) {
                    map.put(keyValues[i].toString(), keyValues[i + 1]);
                }
            }
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.error("Failed to serialize analytics event data to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    @Async
    @EventListener
    public void handleProductViewed(ProductViewedEvent event) {
        try {
            log.info("Analytics consuming ProductViewed event for product: {}", event.getProductSlug());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("ProductViewed")
                    .metricValue(BigDecimal.ONE)
                    .userId(event.getUserId())
                    .referenceId(event.getProductId() != null ? event.getProductId().toString() : event.getProductSlug())
                    .eventDataJson(createJson("productSlug", event.getProductSlug(), "title", event.getProductTitle()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process ProductViewed event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleAddToCart(AddToCartEvent event) {
        try {
            log.info("Analytics consuming AddToCart event for variant: {}", event.getVariantId());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("AddToCart")
                    .metricValue(BigDecimal.valueOf(event.getQuantity()))
                    .userId(event.getUserId())
                    .referenceId(event.getVariantId() != null ? event.getVariantId().toString() : null)
                    .eventDataJson(createJson("quantity", event.getQuantity(), "priceInr", event.getPriceInr()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process AddToCart event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleCheckoutStarted(CheckoutStartedEvent event) {
        try {
            log.info("Analytics consuming CheckoutStarted event for cart: {}", event.getCartId());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("CheckoutStarted")
                    .metricValue(event.getSubtotalInr())
                    .userId(event.getUserId())
                    .referenceId(event.getCartId() != null ? event.getCartId().toString() : null)
                    .eventDataJson(createJson("itemCount", event.getItemCount(), "subtotal", event.getSubtotalInr()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process CheckoutStarted event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        try {
            log.info("Analytics consuming OrderCreated event for order: {}", event.getOrderNumber());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("OrderCreated")
                    .metricValue(event.getTotalAmountInr())
                    .userId(event.getUserId())
                    .referenceId(event.getOrderId() != null ? event.getOrderId().toString() : event.getOrderNumber())
                    .eventDataJson(createJson("orderNumber", event.getOrderNumber(), "total", event.getTotalAmountInr()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process OrderCreated event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handlePaymentCaptured(PaymentCapturedEvent event) {
        try {
            log.info("Analytics consuming PaymentCaptured event for order: {}", event.getOrderId());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("PaymentCaptured")
                    .metricValue(event.getAmountInr())
                    .referenceId(event.getPaymentId() != null ? event.getPaymentId().toString() : null)
                    .eventDataJson(createJson("orderId", event.getOrderId(), "razorpayPaymentId", event.getRazorpayPaymentId()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process PaymentCaptured event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleOrderDelivered(OrderDeliveredEvent event) {
        try {
            log.info("Analytics consuming OrderDelivered event for order: {}", event.getOrderNumber());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("OrderDelivered")
                    .metricValue(BigDecimal.ONE)
                    .referenceId(event.getOrderId() != null ? event.getOrderId().toString() : event.getOrderNumber())
                    .eventDataJson(createJson("orderNumber", event.getOrderNumber()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process OrderDelivered event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleEnrollmentCreated(EnrollmentCreatedEvent event) {
        try {
            log.info("Analytics consuming EnrollmentCreated event for course: {}", event.getCourseId());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("EnrollmentCreated")
                    .metricValue(event.getFeePaidInr())
                    .userId(event.getUserId())
                    .referenceId(event.getEnrollmentId() != null ? event.getEnrollmentId().toString() : null)
                    .eventDataJson(createJson("courseId", event.getCourseId(), "feePaid", event.getFeePaidInr()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process EnrollmentCreated event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleEnrollmentConfirmed(EnrollmentConfirmedEvent event) {
        try {
            log.info("Analytics consuming EnrollmentConfirmed event for enrollment: {}", event.getEnrollmentId());
            AnalyticsEvent entity = AnalyticsEvent.builder()
                    .eventName("EnrollmentConfirmed")
                    .metricValue(BigDecimal.ONE)
                    .userId(event.getUserId())
                    .referenceId(event.getEnrollmentId() != null ? event.getEnrollmentId().toString() : null)
                    .eventDataJson(createJson("courseTitle", event.getCourseTitle()))
                    .build();
            analyticsEventRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to process EnrollmentConfirmed event in AnalyticsEventListener: {}", e.getMessage(), e);
        }
    }
}
