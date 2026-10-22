package com.sporekart.customer.application;

import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrainingCapabilityEventListener {

    private final CustomerService customerService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEnrollmentConfirmed(EnrollmentConfirmedEvent event) {
        log.info("Handling EnrollmentConfirmedEvent for user ID: {}, course: {}", event.getUserId(), event.getCourseTitle());
        if (event.getUserId() == null) {
            return;
        }
        try {
            customerService.grantTrainingCapability(event.getUserId(), event.getEnrollmentId(), event.getCourseTitle());
        } catch (Exception e) {
            log.warn("Could not grant TRAINING capability for user ID {}: {}", event.getUserId(), e.getMessage());
        }
    }
}

