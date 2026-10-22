package com.sporekart.payment.application;

import com.sporekart.payment.domain.PaymentEvent;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventIdempotencyService {

    private final PaymentEventRepository paymentEventRepository;

    /**
     * Checks if event is unique and records it safely without triggering duplicate constraint errors.
     * Returns true if saved successfully; false if duplicate event was caught.
     */
    public boolean recordEventIfUnique(PaymentEvent event) {
        if (event.getEventId() != null && !event.getEventId().trim().isEmpty()) {
            if (paymentEventRepository.findByEventId(event.getEventId()).isPresent()) {
                log.info("Webhook event ID {} already recorded. Idempotent ignore.", event.getEventId());
                return false;
            }
        }
        paymentEventRepository.save(event);
        return true;
    }
}
