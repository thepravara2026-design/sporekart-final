package com.sporekart.training.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/training")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;
    private final com.sporekart.customer.application.CapabilityService capabilityService;

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<TrainingDtos.CourseResponse>>> getCourses() {
        List<Course> courses = trainingService.getAllActiveCourses();
        List<TrainingDtos.CourseResponse> response = courses.stream().map(this::mapCourse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/courses/{slug}")
    public ResponseEntity<ApiResponse<TrainingDtos.CourseResponse>> getCourseBySlug(@PathVariable String slug) {
        Course course = trainingService.getCourseBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Course not found for slug: " + slug));
        return ResponseEntity.ok(ApiResponse.success(mapCourse(course)));
    }

    @GetMapping("/courses/{courseId}/batches")
    public ResponseEntity<ApiResponse<List<TrainingDtos.BatchResponse>>> getBatchesForCourse(@PathVariable UUID courseId) {
        List<Batch> batches = trainingService.getBatchesForCourse(courseId);
        List<TrainingDtos.BatchResponse> response = batches.stream().map(this::mapBatch).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> enroll(
            @RequestAttribute(value = "userId", required = false) UUID authUserId,
            @Valid @RequestBody TrainingDtos.EnrollRequest request) {

        UUID userId = authUserId != null ? authUserId : UUID.randomUUID(); // Fallback for guest enrollment registration
        Enrollment enrollment = trainingService.enrollCustomer(userId, request.getBatchId());
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(enrollment)));
    }

    @PostMapping("/enrollments/{enrollmentId}/confirm-payment")
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> confirmPayment(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody TrainingDtos.ConfirmPaymentRequest request) {

        Enrollment enrollment = trainingService.confirmEnrollmentPayment(enrollmentId, request.getPaymentReference());
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(enrollment)));
    }

    @GetMapping("/user/{userId}/enrollments")
    public ResponseEntity<ApiResponse<List<TrainingDtos.EnrollmentResponse>>> getUserEnrollments(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID userId) {
        UUID authUserId = extractUserId(authentication);
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (authUserId == null || (!authUserId.equals(userId) && !isAdmin)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "Access denied to training enrollments"));
        }

        List<Enrollment> enrollments = trainingService.getUserEnrollments(userId);
        List<TrainingDtos.EnrollmentResponse> response = enrollments.stream().map(this::mapEnrollment).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/certificate/{enrollmentId}")
    public ResponseEntity<ApiResponse<TrainingDtos.CertificateResponse>> getCertificate(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID enrollmentId) {
        UUID authUserId = extractUserId(authentication);
        if (authUserId != null && !capabilityService.hasCapability(authUserId, com.sporekart.customer.domain.CustomerCapability.TRAINING)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "TRAINING capability required to access certificates"));
        }
        Certificate cert = trainingService.getCertificateByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found for enrollment: " + enrollmentId));

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (authUserId == null || (cert.getEnrollment() != null && cert.getEnrollment().getUserId() != null && !cert.getEnrollment().getUserId().equals(authUserId) && !isAdmin)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "Access denied to certificate"));
        }

        return ResponseEntity.ok(ApiResponse.success(mapCertificate(cert)));
    }

    private UUID extractUserId(org.springframework.security.core.Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
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
        List<TrainingDtos.ScheduleResponse> schedules = batch.getSchedules().stream().map(s -> TrainingDtos.ScheduleResponse.builder()
                .id(s.getId())
                .topic(s.getTopic())
                .scheduledAt(s.getScheduledAt())
                .durationMinutes(s.getDurationMinutes())
                .meetingLink(s.getMeetingLink())
                .build()).collect(Collectors.toList());

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
                .schedules(schedules)
                .build();
    }

    private TrainingDtos.EnrollmentResponse mapEnrollment(Enrollment enrollment) {
        return TrainingDtos.EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .batchId(enrollment.getBatch().getId())
                .batchCode(enrollment.getBatch().getBatchCode())
                .status(enrollment.getStatus())
                .feePaidInr(enrollment.getFeePaidInr())
                .paymentReference(enrollment.getPaymentReference())
                .enrolledAt(enrollment.getEnrolledAt())
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
