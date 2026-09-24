package com.sporekart.training.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/training")
@RequiredArgsConstructor
public class AdminTrainingController {

    private final TrainingService trainingService;

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CourseCategory>> createCategory(@Valid @RequestBody TrainingDtos.CreateCategoryRequest request) {
        CourseCategory category = trainingService.createCategory(request.getName(), request.getSlug(), request.getDescription());
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<TrainingDtos.CourseResponse>> createCourse(@Valid @RequestBody TrainingDtos.CreateCourseRequest request) {
        Course course = trainingService.createCourse(
                request.getCategoryId(),
                request.getTitle(),
                request.getSlug(),
                request.getDescription(),
                request.getDurationDays(),
                request.getFeeInr()
        );
        return ResponseEntity.ok(ApiResponse.success(mapCourse(course)));
    }

    @PostMapping("/batches")
    public ResponseEntity<ApiResponse<TrainingDtos.BatchResponse>> createBatch(@Valid @RequestBody TrainingDtos.CreateBatchRequest request) {
        Batch batch = trainingService.createBatch(
                request.getCourseId(),
                request.getBatchCode(),
                request.getStartDate(),
                request.getEndDate(),
                request.getCapacity()
        );
        return ResponseEntity.ok(ApiResponse.success(mapBatch(batch)));
    }

    @PostMapping("/schedules")
    public ResponseEntity<ApiResponse<TrainingDtos.ScheduleResponse>> addSchedule(@Valid @RequestBody TrainingDtos.AddScheduleRequest request) {
        BatchSchedule schedule = trainingService.addBatchSchedule(
                request.getBatchId(),
                request.getTopic(),
                request.getScheduledAt(),
                request.getDurationMinutes(),
                request.getMeetingLink()
        );
        return ResponseEntity.ok(ApiResponse.success(mapSchedule(schedule)));
    }

    @PostMapping("/attendance")
    public ResponseEntity<ApiResponse<String>> markAttendance(@Valid @RequestBody TrainingDtos.MarkAttendanceRequest request) {
        trainingService.markAttendance(request.getEnrollmentId(), request.getScheduleId(), request.isPresent());
        return ResponseEntity.ok(ApiResponse.success("Attendance marked successfully"));
    }

    @PostMapping("/complete-course")
    public ResponseEntity<ApiResponse<TrainingDtos.CertificateResponse>> completeCourse(@Valid @RequestBody TrainingDtos.CompleteCourseRequest request) {
        Certificate cert = trainingService.completeCourseAndIssueCertificate(request.getEnrollmentId(), request.getGrade());
        return ResponseEntity.ok(ApiResponse.success(mapCertificate(cert)));
    }

    private TrainingDtos.CourseResponse mapCourse(Course course) {
        return TrainingDtos.CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .durationDays(course.getDurationDays())
                .feeInr(course.getFeeInr())
                .isActive(course.isActive())
                .build();
    }

    private TrainingDtos.BatchResponse mapBatch(Batch batch) {
        return TrainingDtos.BatchResponse.builder()
                .id(batch.getId())
                .courseId(batch.getCourse().getId())
                .courseTitle(batch.getCourse().getTitle())
                .batchCode(batch.getBatchCode())
                .startDate(batch.getStartDate())
                .endDate(batch.getEndDate())
                .capacity(batch.getCapacity())
                .enrolledCount(batch.getEnrolledCount())
                .status(batch.getStatus())
                .build();
    }

    private TrainingDtos.ScheduleResponse mapSchedule(BatchSchedule s) {
        return TrainingDtos.ScheduleResponse.builder()
                .id(s.getId())
                .topic(s.getTopic())
                .scheduledAt(s.getScheduledAt())
                .durationMinutes(s.getDurationMinutes())
                .meetingLink(s.getMeetingLink())
                .build();
    }

    private TrainingDtos.CertificateResponse mapCertificate(Certificate cert) {
        return TrainingDtos.CertificateResponse.builder()
                .id(cert.getId())
                .enrollmentId(cert.getEnrollment().getId())
                .certificateCode(cert.getCertificateCode())
                .issueDate(cert.getIssueDate())
                .certificateUrl(cert.getCertificateUrl())
                .build();
    }
}
