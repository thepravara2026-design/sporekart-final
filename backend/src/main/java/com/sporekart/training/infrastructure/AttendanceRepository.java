package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByEnrollmentId(UUID enrollmentId);
    List<Attendance> findByScheduleId(UUID scheduleId);
    Optional<Attendance> findByEnrollmentIdAndScheduleId(UUID enrollmentId, UUID scheduleId);
}
