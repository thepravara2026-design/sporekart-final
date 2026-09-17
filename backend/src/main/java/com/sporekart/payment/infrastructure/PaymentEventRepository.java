package com.sporekart.payment.infrastructure;

import com.sporekart.payment.domain.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {
    Optional<PaymentEvent> findByEventId(String eventId);
    List<PaymentEvent> findByPaymentIdOrderByCreatedAtDesc(UUID paymentId);
}
