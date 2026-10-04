package com.sporekart.review.infrastructure;

import com.sporekart.review.domain.InvitationStatus;
import com.sporekart.review.domain.ReviewInvitationState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewInvitationStateRepository extends JpaRepository<ReviewInvitationState, UUID> {
    Optional<ReviewInvitationState> findByCustomerIdAndOrderItemId(UUID customerId, UUID orderItemId);
    List<ReviewInvitationState> findByCustomerIdAndInvitationStatus(UUID customerId, InvitationStatus status);
}
