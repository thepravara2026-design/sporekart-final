package com.sporekart.training.application;

import com.sporekart.training.domain.*;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import com.sporekart.training.infrastructure.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingService {

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;
    private final BatchScheduleRepository scheduleRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final CompletionRepository completionRepository;
    private final CertificateRepository certificateRepository;
    private final ApplicationEventPublisher eventPublisher;

    // --- Categories & Courses ---
    @Transactional
    public CourseCategory createCategory(String name, String slug, String description) {
        CourseCategory category = CourseCategory.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .build();
        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public List<CourseCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Course createCourse(UUID categoryId, String title, String slug, String description, Integer durationDays, BigDecimal feeInr) {
        CourseCategory category = categoryId != null ? categoryRepository.findById(categoryId).orElse(null) : null;
        Course course = Course.builder()
                .category(category)
                .title(title)
                .slug(slug)
                .description(description)
                .durationDays(durationDays)
                .feeInr(feeInr)
                .isActive(true)
                .build();
        return courseRepository.save(course);
    }

    @Transactional(readOnly = true)
    public List<Course> getAllActiveCourses() {
        return courseRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public Optional<Course> getCourseBySlug(String slug) {
        return courseRepository.findBySlug(slug);
    }

    // --- Batches & Schedules ---
    @Transactional
    public Batch createBatch(UUID courseId, String batchCode, LocalDate startDate, LocalDate endDate, Integer capacity) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseId));

        Batch batch = Batch.builder()
                .course(course)
                .batchCode(batchCode)
                .startDate(startDate)
                .endDate(endDate)
                .capacity(capacity)
                .enrolledCount(0)
                .status(BatchStatus.UPCOMING)
                .build();
        return batchRepository.save(batch);
    }

    @Transactional(readOnly = true)
    public List<Batch> getBatchesForCourse(UUID courseId) {
        return batchRepository.findByCourseId(courseId);
    }

    @Transactional
    public BatchSchedule addBatchSchedule(UUID batchId, String topic, ZonedDateTime scheduledAt, Integer durationMinutes, String meetingLink) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found: " + batchId));

        BatchSchedule schedule = BatchSchedule.builder()
                .batch(batch)
                .topic(topic)
                .scheduledAt(scheduledAt)
                .durationMinutes(durationMinutes)
                .meetingLink(meetingLink)
                .build();
        return scheduleRepository.save(schedule);
    }

    @Transactional(readOnly = true)
    public List<BatchSchedule> getSchedulesForBatch(UUID batchId) {
        return scheduleRepository.findByBatchIdOrderByScheduledAtAsc(batchId);
    }

    // --- Enrollment & Registration Flow ---
    @Transactional
    public Enrollment enrollCustomer(UUID userId, UUID batchId) {
        Batch batch = batchRepository.findWithLockById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found: " + batchId));

        if (!batch.hasAvailableCapacity()) {
            throw new IllegalStateException("Batch '" + batch.getBatchCode() + "' is full. Cannot enroll.");
        }

        Optional<Enrollment> existing = enrollmentRepository.findByUserIdAndBatchId(userId, batchId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Course course = batch.getCourse();

        Enrollment enrollment = Enrollment.builder()
                .userId(userId)
                .course(course)
                .batch(batch)
                .status(EnrollmentStatus.PENDING_PAYMENT)
                .feePaidInr(course.getFeeInr())
                .build();

        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public Enrollment confirmEnrollmentPayment(UUID enrollmentId, String paymentReference) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == EnrollmentStatus.CONFIRMED) {
            return enrollment;
        }

        Batch batch = batchRepository.findWithLockById(enrollment.getBatch().getId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found for enrollment"));

        if (!batch.hasAvailableCapacity()) {
            throw new IllegalStateException("Batch full during payment confirmation");
        }

        batch.incrementEnrolledCount();
        batchRepository.save(batch);

        enrollment.setStatus(EnrollmentStatus.CONFIRMED);
        enrollment.setPaymentReference(paymentReference);
        Enrollment saved = enrollmentRepository.save(enrollment);

        // Publish EnrollmentConfirmedEvent
        log.info("Publishing EnrollmentConfirmedEvent for enrollment ID: {}", enrollmentId);
        EnrollmentConfirmedEvent event = new EnrollmentConfirmedEvent(
                this,
                saved.getUserId(),
                saved.getId(),
                saved.getCourse().getId(),
                saved.getBatch().getId(),
                saved.getCourse().getTitle()
        );
        eventPublisher.publishEvent(event);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Enrollment> getUserEnrollments(UUID userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId);
    }

    // --- Attendance, Completion & Certificates ---
    @Transactional
    public Attendance markAttendance(UUID enrollmentId, UUID scheduleId, boolean isPresent) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));
        BatchSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));

        Attendance attendance = attendanceRepository.findByEnrollmentIdAndScheduleId(enrollmentId, scheduleId)
                .orElseGet(() -> Attendance.builder()
                        .enrollment(enrollment)
                        .schedule(schedule)
                        .build());

        attendance.setPresent(isPresent);
        attendance.setMarkedAt(ZonedDateTime.now());
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Certificate completeCourseAndIssueCertificate(UUID enrollmentId, String grade) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
            return certificateRepository.findByEnrollmentId(enrollmentId)
                    .orElseThrow(() -> new IllegalStateException("Certificate missing for completed enrollment"));
        }

        Completion completion = Completion.builder()
                .enrollment(enrollment)
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourse().getId())
                .grade(grade != null ? grade : "PASS")
                .build();
        completionRepository.save(completion);

        String certCode = generateCertificateCode();
        String certUrl = "https://sporekart.com/certificates/" + certCode + ".pdf";

        Certificate certificate = Certificate.builder()
                .enrollment(enrollment)
                .certificateCode(certCode)
                .issueDate(LocalDate.now())
                .certificateUrl(certUrl)
                .build();
        Certificate savedCert = certificateRepository.save(certificate);

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollmentRepository.save(enrollment);

        return savedCert;
    }

    @Transactional(readOnly = true)
    public Optional<Certificate> getCertificateByEnrollmentId(UUID enrollmentId) {
        return certificateRepository.findByEnrollmentId(enrollmentId);
    }

    private String generateCertificateCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomHex = String.format("%04X", new Random().nextInt(0x10000));
        return "CERT-" + datePrefix + "-" + randomHex;
    }
}
