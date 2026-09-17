package com.sporekart.training.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Completion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "completed_at", nullable = false)
    private ZonedDateTime completedAt;

    @Column(name = "grade")
    private String grade;

    @PrePersist
    protected void onCreate() {
        if (completedAt == null) {
            completedAt = ZonedDateTime.now();
        }
    }
}
