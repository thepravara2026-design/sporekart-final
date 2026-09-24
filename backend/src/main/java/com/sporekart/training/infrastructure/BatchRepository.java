package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Batch;
import com.sporekart.training.domain.BatchStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    Optional<Batch> findByBatchCode(String batchCode);

    @EntityGraph(attributePaths = {"schedules"})
    List<Batch> findByCourseId(UUID courseId);

    @EntityGraph(attributePaths = {"schedules"})
    List<Batch> findByCourseIdAndStatus(UUID courseId, BatchStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Batch> findWithLockById(UUID id);
}
