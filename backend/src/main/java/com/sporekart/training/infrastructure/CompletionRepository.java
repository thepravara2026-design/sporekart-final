package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Completion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompletionRepository extends JpaRepository<Completion, UUID> {
    Optional<Completion> findByEnrollmentId(UUID enrollmentId);
    Optional<Completion> findByUserIdAndCourseId(UUID userId, UUID courseId);
}
