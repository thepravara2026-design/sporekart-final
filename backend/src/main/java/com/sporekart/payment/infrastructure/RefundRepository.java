package com.sporekart.payment.infrastructure;

import com.sporekart.payment.domain.Refund;
import com.sporekart.payment.domain.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    Optional<Refund> findByRazorpayRefundId(String razorpayRefundId);

    Optional<Refund> findByIdempotencyKey(String idempotencyKey);

    List<Refund> findByPaymentId(UUID paymentId);

    List<Refund> findByOrderId(UUID orderId);

    List<Refund> findByStatus(RefundStatus status);

    List<Refund> findByStatusAndCreatedAtBefore(RefundStatus status, OffsetDateTime cutoff);

    @Query("SELECT COALESCE(SUM(r.amountInr), 0) FROM Refund r WHERE r.payment.id = :paymentId AND r.status IN :statuses")
    BigDecimal sumRefundedAmountByPaymentIdAndStatuses(
            @Param("paymentId") UUID paymentId,
            @Param("statuses") Collection<RefundStatus> statuses
    );
}
