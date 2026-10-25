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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Scheduled(fixedDelayString = "${sporekart.payment.reconciliation.interval-ms:600000}", initialDelay = 120000)
    public void runScheduledReconciliation() {
        log.info("Starting background payment and refund reconciliation job...");
        try {
            ReconciliationReport report = reconcileStuckPayments(OffsetDateTime.now().minusMinutes(15));
            log.info("Payment reconciliation finished: checked={}, reconciledCaptured={}, reconciledFailed={}",
                    report.getPaymentsChecked(), report.getPaymentsCaptured(), report.getPaymentsFailed());
        } catch (Exception e) {
            log.error("Error during scheduled payment reconciliation: {}", e.getMessage(), e);
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
                    } else if (details != null && "failed".equalsIgnoreCase(details.getStatus())) {
                        payment.setStatus(PaymentStatus.FAILED);
                        paymentRepository.save(payment);
                        failed++;
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch gateway status for payment {}: {}", paymentId, ex.getMessage());
                }
            } else if (payment.getCreatedAt().isBefore(OffsetDateTime.now().minusHours(2))) {
                // Initiated payments with no payment attempt after 2 hours marked as expired/failed
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                failed++;
            }
        }

        return ReconciliationReport.builder()
                .paymentsChecked(checked)
                .paymentsCaptured(captured)
                .paymentsFailed(failed)
                .build();
    }

    @Data
    @Builder
    public static class ReconciliationReport {
        private int paymentsChecked;
        private int paymentsCaptured;
        private int paymentsFailed;
    }
}
