package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.domain.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    List<Enrollment> findByUserIdOrderByEnrolledAtDesc(UUID userId);
    Optional<Enrollment> findByUserIdAndBatchId(UUID userId, UUID batchId);
    List<Enrollment> findByBatchId(UUID batchId);
    List<Enrollment> findByBatchIdAndStatus(UUID batchId, EnrollmentStatus status);
}
