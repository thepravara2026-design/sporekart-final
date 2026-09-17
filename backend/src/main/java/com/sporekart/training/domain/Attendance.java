package com.sporekart.training.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private BatchSchedule schedule;

    @Column(name = "is_present", nullable = false)
    @Builder.Default
    private boolean isPresent = false;

    @Column(name = "marked_at", nullable = false)
    private ZonedDateTime markedAt;

    @PrePersist
    protected void onCreate() {
        if (markedAt == null) {
            markedAt = ZonedDateTime.now();
        }
    }
}
