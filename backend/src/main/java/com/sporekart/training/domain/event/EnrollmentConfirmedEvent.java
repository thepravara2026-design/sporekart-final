package com.sporekart.training.domain.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
public class EnrollmentConfirmedEvent extends ApplicationEvent {

    private final UUID userId;
    private final UUID enrollmentId;
    private final UUID courseId;
    private final UUID batchId;
    private final String courseTitle;
    private final ZonedDateTime confirmedAt;

    public EnrollmentConfirmedEvent(Object source, UUID userId, UUID enrollmentId, UUID courseId, UUID batchId, String courseTitle) {
        super(source);
        this.userId = userId;
        this.enrollmentId = enrollmentId;
        this.courseId = courseId;
        this.batchId = batchId;
        this.courseTitle = courseTitle;
        this.confirmedAt = ZonedDateTime.now();
    }
}
