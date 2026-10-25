package com.sporekart.payment.infrastructure;

import com.sporekart.payment.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    List<Payment> findByOrderId(UUID orderId);
    List<Payment> findByStatus(com.sporekart.payment.domain.PaymentStatus status);
    List<Payment> findByStatusAndCreatedAtBefore(com.sporekart.payment.domain.PaymentStatus status, java.time.OffsetDateTime cutoff);
}
