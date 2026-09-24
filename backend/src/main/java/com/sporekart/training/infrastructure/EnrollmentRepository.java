package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.domain.EnrollmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    @EntityGraph(attributePaths = {"course", "batch"})
    List<Enrollment> findByUserIdOrderByEnrolledAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"course", "batch"})
    Optional<Enrollment> findByUserIdAndBatchId(UUID userId, UUID batchId);

    @EntityGraph(attributePaths = {"course", "batch"})
    Optional<Enrollment> findById(UUID id);

    List<Enrollment> findByBatchId(UUID batchId);
    List<Enrollment> findByBatchIdAndStatus(UUID batchId, EnrollmentStatus status);
}
