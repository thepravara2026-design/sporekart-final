package com.sporekart.payment.application;

import com.sporekart.analytics.domain.events.PaymentCapturedEvent;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.payment.infrastructure.RefundRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentReconciliationService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final PaymentGateway paymentGateway;
    private final OrderService orderService;
    private final ApplicationEventPublisher eventPublisher;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.notification.application.NotificationEventService notificationEventService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private io.micrometer.core.instrument.MeterRegistry meterRegistry;

    private void recordMetric(String name, String... tags) {
        if (meterRegistry != null) {
            try {
                meterRegistry.counter(name, tags).increment();
            } catch (Exception e) {
                log.debug("Failed to record metric {}: {}", name, e.getMessage());
            }
        }
    }

    @Scheduled(fixedDelayString = "${sporekart.payment.reconciliation.interval-ms:600000}", initialDelay = 120000)
    @SchedulerLock(name = "PaymentReconciliationService_reconcile", lockAtMostFor = "9m", lockAtLeastFor = "2m")
    public void runScheduledReconciliation() {
        log.info("Starting background payment and refund reconciliation job...");
        try {
            ReconciliationReport report = reconcileStuckPayments(OffsetDateTime.now().minusMinutes(15));
            log.info("Payment reconciliation finished: checked={}, reconciledCaptured={}, reconciledFailed={}",
                    report.getPaymentsChecked(), report.getPaymentsCaptured(), report.getPaymentsFailed());
        } catch (Exception e) {
            log.error("Error during scheduled payment reconciliation: {}", e.getMessage(), e);
        }

        try {
            RefundReconciliationReport refundReport = reconcilePendingRefunds(OffsetDateTime.now().minusMinutes(15));
            log.info("Refund reconciliation finished: checked={}, reconciledProcessed={}, reconciledFailed={}",
                    refundReport.getRefundsChecked(), refundReport.getRefundsProcessed(), refundReport.getRefundsFailed());
        } catch (Exception e) {
            log.error("Error during scheduled refund reconciliation: {}", e.getMessage(), e);
        }
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public ReconciliationReport reconcileStuckPayments(OffsetDateTime cutoff) {
        List<Payment> initiatedPayments = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.INITIATED, cutoff);

        int checked = 0;
        int captured = 0;
        int failed = 0;

        for (Payment payment : initiatedPayments) {
            checked++;
            String paymentId = payment.getRazorpayPaymentId();
            if (paymentId != null && !paymentId.isBlank()) {
                try {
                    PaymentGateway.GatewayPaymentDetails details = paymentGateway.fetchPayment(paymentId);
                    if (details != null && "captured".equalsIgnoreCase(details.getStatus())) {
                        payment.setStatus(PaymentStatus.CAPTURED);
                        PaymentEvent event = PaymentEvent.builder()
                                .payment(payment)
                                .eventType("RECONCILIATION_AUTO_CAPTURED")
                                .eventDataJson("{\"gatewayStatus\":\"captured\"}")
                                .createdBy("RECONCILIATION_SERVICE")
                                .build();
                        payment.addEvent(event);
                        paymentRepository.save(payment);

                        if (payment.getOrderId() != null) {
                            orderService.setRazorpayPaymentId(payment.getOrderId(), paymentId);
                            orderService.updateOrderStatus(payment.getOrderId(), OrderStatus.PAID, "Payment auto-reconciled via background job", "RECONCILIATION_SERVICE");
                            orderService.confirmOrderInventory(payment.getOrderId());
                            eventPublisher.publishEvent(PaymentCapturedEvent.builder()
                                    .paymentId(payment.getId())
                                    .orderId(payment.getOrderId())
                                    .amountInr(payment.getAmountInr())
                                    .razorpayPaymentId(paymentId)
                                    .build());
                        }
                        captured++;
                        recordMetric("payment.reconciliation.auto_captured.total");
                    } else if (details != null && "failed".equalsIgnoreCase(details.getStatus())) {
                        payment.setStatus(PaymentStatus.FAILED);
                        paymentRepository.save(payment);
                        failed++;
                        recordMetric("payment.reconciliation.failed.total");
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch gateway status for payment {}: {}", paymentId, ex.getMessage());
                }
            } else if (payment.getCreatedAt().isBefore(OffsetDateTime.now().minusHours(2))) {
                // Initiated payments with no payment attempt after 2 hours marked as expired/failed
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                failed++;
                recordMetric("payment.reconciliation.expired.total");
            }
        }

        return ReconciliationReport.builder()
                .paymentsChecked(checked)
                .paymentsCaptured(captured)
                .paymentsFailed(failed)
                .build();
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public RefundReconciliationReport reconcilePendingRefunds(OffsetDateTime cutoff) {
        List<com.sporekart.payment.domain.Refund> pendingRefunds = refundRepository.findByStatus(com.sporekart.payment.domain.RefundStatus.PENDING);

        int checked = 0;
        int reconciledProcessed = 0;
        int reconciledFailed = 0;

        for (com.sporekart.payment.domain.Refund refund : pendingRefunds) {
            checked++;
            String rzpRefundId = refund.getRazorpayRefundId();
            if (rzpRefundId != null && !rzpRefundId.isBlank()) {
                try {
                    PaymentGateway.GatewayRefundDetails details = paymentGateway.fetchRefund(rzpRefundId);
                    if (details != null && "processed".equalsIgnoreCase(details.getStatus())) {
                        refund.setStatus(com.sporekart.payment.domain.RefundStatus.PROCESSED);
                        refundRepository.save(refund);

                        Payment payment = refund.getPayment();
                        if (payment != null) {
                            BigDecimal totalRefunded = null;
                            try {
                                totalRefunded = refundRepository.sumRefundedAmountByPaymentIdAndStatuses(
                                        payment.getId(),
                                        java.util.List.of(com.sporekart.payment.domain.RefundStatus.PROCESSED)
                                );
                            } catch (Exception ignored) {
                            }
                            boolean isFullRefund = (totalRefunded == null || payment.getAmountInr() == null || totalRefunded.compareTo(payment.getAmountInr()) >= 0);
                            payment.setStatus(isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
                            PaymentEvent event = PaymentEvent.builder()
                                    .payment(payment)
                                    .eventType("RECONCILIATION_REFUND_PROCESSED")
                                    .eventDataJson("{\"gatewayStatus\":\"processed\",\"refundId\":\"" + rzpRefundId + "\"}")
                                    .createdBy("RECONCILIATION_SERVICE")
                                    .build();
                            payment.addEvent(event);
                            paymentRepository.save(payment);

                            if (payment.getOrderId() != null) {
                                orderService.updateOrderStatus(
                                        payment.getOrderId(),
                                        isFullRefund ? OrderStatus.REFUNDED : OrderStatus.REFUND_PENDING,
                                        "Refund auto-reconciled via background job (Ref: " + rzpRefundId + ")",
                                        "RECONCILIATION_SERVICE"
                                );
                            }
                        }
                        reconciledProcessed++;
                        recordMetric("refund.reconciliation.auto_processed.total");
                    } else if (details != null && "failed".equalsIgnoreCase(details.getStatus())) {
                        refund.setStatus(com.sporekart.payment.domain.RefundStatus.FAILED);
                        refund.setFailureReason("Gateway reported refund failed during reconciliation");
                        refundRepository.save(refund);
                        reconciledFailed++;
                        recordMetric("refund.reconciliation.failed.total");

                        if (notificationEventService != null && refund.getOrderId() != null) {
                            try {
                                var ord = orderService.getOrderById(refund.getOrderId());
                                String recipientEmail = ord.getShippingAddress() != null ? ord.getShippingAddress().getEmail() : null;
                                String recipientName = (ord.getShippingAddress() != null && ord.getShippingAddress().getRecipientName() != null)
                                        ? ord.getShippingAddress().getRecipientName() : "Valued Customer";
                                notificationEventService.recordEvent(
                                        com.sporekart.notification.domain.NotificationEventType.REFUND_FAILED,
                                        "ORDER",
                                        refund.getOrderId(),
                                        ord.getUserId(),
                                        recipientEmail,
                                        recipientName,
                                        "Refund Failed: Order #" + ord.getOrderNumber() + " ⚠️",
                                        java.util.Map.of(
                                                "orderNumber", ord.getOrderNumber(),
                                                "refundId", rzpRefundId != null ? rzpRefundId : "N/A",
                                                "actionUrl", "/dashboard?tab=orders&orderId=" + refund.getOrderId()
                                        ),
                                        "REFUND_FAILED:" + refund.getId()
                                );
                            } catch (Exception notifEx) {
                                log.warn("Failed to dispatch refund failure notification: {}", notifEx.getMessage());
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch gateway status for refund {}: {}", rzpRefundId, ex.getMessage());
                }
            } else if (refund.getCreatedAt() != null && cutoff != null && refund.getCreatedAt().isBefore(cutoff)) {
                // Refund was never dispatched successfully to gateway and has exceeded timeout cutoff
                refund.setStatus(com.sporekart.payment.domain.RefundStatus.FAILED);
                if (refund.getFailureReason() == null || refund.getFailureReason().isBlank()) {
                    refund.setFailureReason("Gateway refund dispatch timed out or failed without gateway refund ID");
                }
                refundRepository.save(refund);
                reconciledFailed++;
                recordMetric("refund.reconciliation.dispatch_timeout.total");
            }
        }

        return RefundReconciliationReport.builder()
                .refundsChecked(checked)
                .refundsProcessed(reconciledProcessed)
                .refundsFailed(reconciledFailed)
                .build();
    }

    @Data
    @Builder
    public static class ReconciliationReport {
        private int paymentsChecked;
        private int paymentsCaptured;
        private int paymentsFailed;
    }

    @Data
    @Builder
    public static class RefundReconciliationReport {
        private int refundsChecked;
        private int refundsProcessed;
        private int refundsFailed;
    }
}
