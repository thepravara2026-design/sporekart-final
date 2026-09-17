package com.sporekart.customer.application;

import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrainingCapabilityEventListener {

    private final CustomerService customerService;

    @EventListener
    public void onEnrollmentConfirmed(EnrollmentConfirmedEvent event) {
        log.info("Handling EnrollmentConfirmedEvent for user ID: {}, course: {}", event.getUserId(), event.getCourseTitle());
        customerService.grantTrainingCapability(event.getUserId(), event.getEnrollmentId(), event.getCourseTitle());
    }
}
