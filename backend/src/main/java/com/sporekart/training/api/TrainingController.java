package com.sporekart.training.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/training")
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

    @PostMapping({"/enroll", "/bookings"})
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> enroll(
            @RequestAttribute(value = "userId", required = false) UUID authUserId,
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody TrainingDtos.EnrollRequest request) {

        UUID userId = authUserId != null ? authUserId : extractUserId(authentication);
        if (userId == null) {
            userId = UUID.randomUUID(); // Fallback for guest enrollment registration
        }

        UUID targetBatchId = request.getTargetBatchId();
        if (targetBatchId == null) {
            throw new IllegalArgumentException("Batch ID or Slot ID is required for enrollment");
        }

        Enrollment enrollment = trainingService.enrollCustomer(userId, targetBatchId);
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(enrollment)));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<TrainingDtos.EnrollmentResponse>>> getMyBookings(
            org.springframework.security.core.Authentication authentication) {
        UUID authUserId = extractUserId(authentication);
        if (authUserId == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        List<Enrollment> enrollments = trainingService.getUserEnrollments(authUserId);
        List<TrainingDtos.EnrollmentResponse> response = enrollments.stream().map(this::mapEnrollment).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/enrollments/{enrollmentId}/confirm-payment")
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> confirmPayment(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody TrainingDtos.ConfirmPaymentRequest request) {

        Enrollment enrollment = trainingService.confirmEnrollmentPayment(enrollmentId, request.getPaymentReference());
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(enrollment)));
    }

    @GetMapping("/enrollments/{enrollmentId}")
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> getEnrollmentById(
            @PathVariable UUID enrollmentId) {
        Enrollment enrollment = trainingService.getEnrollmentById(enrollmentId);
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(enrollment)));
    }

    @PostMapping("/enrollments/{enrollmentId}/cancel")
    public ResponseEntity<ApiResponse<TrainingDtos.EnrollmentResponse>> cancelEnrollment(
            org.springframework.security.core.Authentication authentication,
            @PathVariable UUID enrollmentId,
            @RequestParam(required = false) String reason) {

        UUID authUserId = extractUserId(authentication);
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Enrollment enrollment = trainingService.getEnrollmentById(enrollmentId);
        if (authUserId == null || (!authUserId.equals(enrollment.getUserId()) && !isAdmin)) {
            return ResponseEntity.status(403).body(ApiResponse.error("FORBIDDEN", "Access denied to cancel enrollment"));
        }

        Enrollment cancelled = trainingService.cancelEnrollment(enrollmentId, authUserId, reason);
        return ResponseEntity.ok(ApiResponse.success(mapEnrollment(cancelled)));
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
        List<Batch> batches = trainingService.getBatchesForCourse(course.getId());
        List<TrainingDtos.BatchSlotResponse> slots = (batches != null ? batches.stream() : java.util.stream.Stream.<Batch>empty())
                .filter(b -> b.getStatus() != BatchStatus.CANCELLED)
                .map(b -> {
                    java.time.ZonedDateTime startTime = (b.getSchedules() != null && !b.getSchedules().isEmpty() && b.getSchedules().get(0).getScheduledAt() != null)
                            ? b.getSchedules().get(0).getScheduledAt()
                            : (b.getStartDate() != null ? b.getStartDate().atStartOfDay(java.time.ZoneId.systemDefault()) : java.time.ZonedDateTime.now());

                    int capacity = b.getCapacity() != null ? b.getCapacity() : 30;
                    int enrolledCount = b.getEnrolledCount() != null ? b.getEnrolledCount() : 0;
                    int availableSeats = Math.max(0, capacity - enrolledCount);
                    boolean isAvailable = (enrolledCount < capacity) && b.getStatus() != BatchStatus.CANCELLED;

                    return TrainingDtos.BatchSlotResponse.builder()
                            .id(b.getId())
                            .batchCode(b.getBatchCode() != null ? b.getBatchCode() : "UPCOMING")
                            .startDate(b.getStartDate())
                            .endDate(b.getEndDate())
                            .startTime(startTime)
                            .capacity(capacity)
                            .enrolledCount(enrolledCount)
                            .availableSeats(availableSeats)
                            .isAvailable(isAvailable)
                            .status(b.getStatus() != null ? b.getStatus().name() : "UPCOMING")
                            .build();
                })
                .collect(Collectors.toList());

        String defaultSyllabus = "[\"Module 1: Substrate Preparation & Pasteurization\",\"Module 2: Cleanroom Spawning & Incubation\",\"Module 3: Fruiting Chamber Climate Control\",\"Module 4: Harvesting & Market Linkages\"]";

        return TrainingDtos.CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .durationDays(course.getDurationDays())
                .feeInr(course.getFeeInr())
                .category(course.getCategory() != null ? course.getCategory().getName() : "Mushroom Cultivation")
                .mode("ONLINE")
                .syllabusJson(defaultSyllabus)
                .isActive(course.isActive())
                .slots(slots)
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
        Batch batch = enrollment.getBatch();
        ZonedDateTime firstScheduleTime = null;
        String meetingLink = null;
        if (batch != null && batch.getSchedules() != null && !batch.getSchedules().isEmpty()) {
            BatchSchedule firstSched = batch.getSchedules().get(0);
            firstScheduleTime = firstSched.getScheduledAt();
            meetingLink = firstSched.getMeetingLink();
        }

        return TrainingDtos.EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourse() != null ? enrollment.getCourse().getId() : null)
                .courseTitle(enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Masterclass")
                .batchId(batch != null ? batch.getId() : null)
                .batchCode(batch != null ? batch.getBatchCode() : null)
                .startDate(batch != null ? batch.getStartDate() : null)
                .endDate(batch != null ? batch.getEndDate() : null)
                .startTime(firstScheduleTime)
                .locationOrLink(meetingLink)
                .status(enrollment.getStatus())
                .feePaidInr(enrollment.getFeePaidInr())
                .amountPaidInr(enrollment.getFeePaidInr())
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
