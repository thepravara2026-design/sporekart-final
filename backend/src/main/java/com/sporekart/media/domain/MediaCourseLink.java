package com.sporekart.media.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_course_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaCourseLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "media_id", nullable = false)
    private UUID mediaId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
