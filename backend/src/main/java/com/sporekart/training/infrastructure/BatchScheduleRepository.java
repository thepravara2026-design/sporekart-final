package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.BatchSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BatchScheduleRepository extends JpaRepository<BatchSchedule, UUID> {
    List<BatchSchedule> findByBatchIdOrderByScheduledAtAsc(UUID batchId);
}
