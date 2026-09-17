package com.sporekart.identity.infrastructure;

import com.sporekart.identity.domain.Otp;
import com.sporekart.identity.domain.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<Otp, UUID> {
    Optional<Otp> findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(String identifier, OtpType otpType);
    int countByIdentifierAndOtpTypeAndCreatedAtAfter(String identifier, OtpType otpType, LocalDateTime since);
}
