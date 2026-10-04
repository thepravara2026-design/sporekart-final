package com.sporekart.training.application;

import com.sporekart.training.domain.*;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import com.sporekart.training.infrastructure.*;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.training.api.TrainingDtos;
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
import java.util.stream.Collectors;

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
    private final TrainingReviewRepository trainingReviewRepository;
    private final TrainingGlimpseRepository trainingGlimpseRepository;
    private final UserRepository userRepository;
    private final com.sporekart.wallet.application.WalletService walletService;
    private final com.sporekart.promotion.application.PromotionService promotionService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Batch getBatchById(UUID batchId) {
        return batchRepository.findById(batchId).orElse(null);
    }

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

    @Transactional
    public List<Course> getAllActiveCourses() {
        List<Course> courses = courseRepository.findByIsActiveTrue();
        for (Course course : courses) {
            List<Batch> batches = batchRepository.findByCourseId(course.getId());
            if (batches == null || batches.isEmpty()) {
                log.info("Auto-provisioning default upcoming batch for course: {}", course.getTitle());
                String codeSlug = course.getSlug() != null ? course.getSlug().replace("-", "").toUpperCase() : "COURSE";
                String batchCode = "BATCH-" + LocalDate.now().getYear() + "-" + codeSlug.substring(0, Math.min(6, codeSlug.length()));
                createBatch(
                        course.getId(),
                        batchCode,
                        LocalDate.now().plusDays(7),
                        LocalDate.now().plusDays(7 + (course.getDurationDays() != null ? course.getDurationDays() : 7)),
                        30
                );
            }
        }
        return courses;
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
        return enrollCustomer(userId, batchId, null);
    }

    @Transactional
    public Enrollment enrollCustomer(UUID userId, UUID batchId, String promoCode) {
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
        BigDecimal feeToPay = course.getFeeInr();

        if (promoCode != null && !promoCode.trim().isEmpty()) {
            com.sporekart.promotion.api.PromotionDtos.PromotionValidationResult promoResult = promotionService.validateAndCalculateForBatch(
                    promoCode, userId, batchId, course.getId(), course.getFeeInr()
            );
            if (!promoResult.isValid()) {
                throw new IllegalArgumentException(promoResult.getMessage());
            }
            feeToPay = promoResult.getFinalAmountInr();
        }

        Enrollment enrollment = Enrollment.builder()
                .userId(userId)
                .course(course)
                .batch(batch)
                .status(EnrollmentStatus.PENDING_PAYMENT)
                .feePaidInr(feeToPay)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        eventPublisher.publishEvent(com.sporekart.analytics.domain.events.EnrollmentCreatedEvent.builder()
                .enrollmentId(saved.getId())
                .courseId(course.getId())
                .feePaidInr(feeToPay)
                .userId(userId)
                .build());

        return saved;
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

    @Transactional(readOnly = true)
    public List<TrainingDtos.AdminEnrollmentResponse> getAllEnrollmentsForAdmin() {
        List<Enrollment> enrollments = enrollmentRepository.findAllByOrderByEnrolledAtDesc();
        if (enrollments.isEmpty()) {
            return List.of();
        }

        List<UUID> userIds = enrollments.stream()
                .map(Enrollment::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        java.util.Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return enrollments.stream().map(e -> {
            User user = userMap.get(e.getUserId());
            String name = null;
            String email = null;
            String phone = null;

            if (user != null) {
                if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
                    name = user.getFullName().trim();
                } else if (user.getFirstName() != null) {
                    name = (user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();
                }
                email = user.getEmail();
                phone = user.getPhone();
            }

            if (name == null || name.isEmpty()) {
                name = email != null ? email.split("@")[0] : "Student Trainee";
            }
            if (email == null) {
                email = "N/A";
            }
            if (phone == null) {
                phone = "N/A";
            }

            String courseTitle = e.getCourse() != null ? e.getCourse().getTitle() : "Masterclass";
            UUID courseId = e.getCourse() != null ? e.getCourse().getId() : null;
            String batchCode = e.getBatch() != null ? e.getBatch().getBatchCode() : "UPCOMING";
            UUID batchId = e.getBatch() != null ? e.getBatch().getId() : null;
            LocalDate startDate = e.getBatch() != null ? e.getBatch().getStartDate() : null;
            LocalDate endDate = e.getBatch() != null ? e.getBatch().getEndDate() : null;

            String refundStatus = "NONE";
            String refundId = null;
            if (e.getStatus() == EnrollmentStatus.CANCELLED) {
                refundStatus = "REFUND_PROCESSED";
                refundId = "rfnd_tr_" + e.getId().toString().substring(0, 8);
            }

            BigDecimal fee = e.getFeePaidInr() != null ? e.getFeePaidInr() : BigDecimal.ZERO;

            return TrainingDtos.AdminEnrollmentResponse.builder()
                    .id(e.getId())
                    .userId(e.getUserId())
                    .studentName(name)
                    .email(email)
                    .phone(phone)
                    .courseId(courseId)
                    .courseTitle(courseTitle)
                    .batchId(batchId)
                    .batchCode(batchCode)
                    .startDate(startDate)
                    .endDate(endDate)
                    .status(e.getStatus())
                    .feePaid(fee)
                    .feePaidInr(fee)
                    .paymentReference(e.getPaymentReference())
                    .refundStatus(refundStatus)
                    .refundId(refundId)
                    .enrolledAt(e.getEnrolledAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Enrollment getEnrollmentById(UUID enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));
    }

    @Transactional
    public Enrollment cancelEnrollment(UUID enrollmentId, UUID userId, String reason) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        if (userId != null && !userId.equals(enrollment.getUserId())) {
            throw new IllegalArgumentException("Access denied: You do not own this enrollment.");
        }

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            return enrollment;
        }

        Batch batch = enrollment.getBatch();
        LocalDate startDate = batch != null ? batch.getStartDate() : null;

        if (startDate != null) {
            if (LocalDate.now().plusDays(7).isAfter(startDate)) {
                throw new IllegalStateException("Enrollment cancellation is only permitted at least 7 days before the batch start date.");
            }
        }

        if (enrollment.getStatus() == EnrollmentStatus.CONFIRMED && batch != null) {
            if (batch.getEnrolledCount() != null && batch.getEnrolledCount() > 0) {
                batch.setEnrolledCount(batch.getEnrolledCount() - 1);
                batchRepository.save(batch);
            }
        }

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        Enrollment saved = enrollmentRepository.save(enrollment);

        if (saved.getUserId() != null && saved.getFeePaidInr() != null && saved.getFeePaidInr().compareTo(java.math.BigDecimal.ZERO) > 0) {
            walletService.processRefundToWallet(
                    saved.getUserId(),
                    saved.getFeePaidInr(),
                    null,
                    saved.getId(),
                    "rfnd_tr_" + saved.getId().toString().substring(0, 8),
                    reason != null ? reason : "Masterclass Training Enrollment Cancellation",
                    "TRAINING_REFUND_SYSTEM"
            );
        }

        log.info("Enrollment ID {} cancelled for user ID {}. Reason: {}", enrollmentId, userId, reason);
        return saved;
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

    // --- Training Reviews & Feedback ---
    @Transactional
    public TrainingReview createTrainingReview(UUID userId, TrainingDtos.CreateTrainingReviewRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required to submit a review");
        }

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found with ID: " + request.getEnrollmentId()));

        if (!userId.equals(enrollment.getUserId())) {
            throw new IllegalArgumentException("Access denied: You can only review your own course enrollments");
        }

        if (enrollment.getStatus() != EnrollmentStatus.CONFIRMED && enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new IllegalStateException("Only confirmed or completed training enrollments can be reviewed");
        }

        if (trainingReviewRepository.existsByUserIdAndEnrollmentId(userId, enrollment.getId())) {
            throw new IllegalStateException("You have already reviewed this course enrollment");
        }

        TrainingReview review = TrainingReview.builder()
                .course(enrollment.getCourse())
                .batch(enrollment.getBatch())
                .enrollment(enrollment)
                .userId(userId)
                .rating(request.getRating())
                .instructorRating(request.getInstructorRating() != null ? request.getInstructorRating() : request.getRating())
                .reviewTitle(request.getReviewTitle())
                .reviewText(request.getReviewText())
                .status("PUBLISHED")
                .isVerifiedTrainee(true)
                .build();

        return trainingReviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public List<TrainingReview> getCourseReviews(UUID courseId) {
        return trainingReviewRepository.findByCourseIdAndStatusOrderByCreatedAtDesc(courseId, "PUBLISHED");
    }

    @Transactional(readOnly = true)
    public TrainingDtos.CourseReviewSummary getCourseReviewSummary(UUID courseId) {
        Double avgRating = trainingReviewRepository.getAverageRatingForCourse(courseId);
        Double avgInstructorRating = trainingReviewRepository.getAverageInstructorRatingForCourse(courseId);
        Long totalReviews = trainingReviewRepository.getReviewCountForCourse(courseId);
        List<Object[]> distribution = trainingReviewRepository.getRatingDistributionForCourse(courseId);

        long five = 0, four = 0, three = 0, two = 0, one = 0;
        if (distribution != null) {
            for (Object[] row : distribution) {
                Integer star = (Integer) row[0];
                Long count = (Long) row[1];
                if (star != null && count != null) {
                    switch (star) {
                        case 5 -> five = count;
                        case 4 -> four = count;
                        case 3 -> three = count;
                        case 2 -> two = count;
                        case 1 -> one = count;
                    }
                }
            }
        }

        return TrainingDtos.CourseReviewSummary.builder()
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .averageInstructorRating(avgInstructorRating != null ? Math.round(avgInstructorRating * 10.0) / 10.0 : (avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0))
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .fiveStarCount(five)
                .fourStarCount(four)
                .threeStarCount(three)
                .twoStarCount(two)
                .oneStarCount(one)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TrainingReview> getUserTrainingReviews(UUID userId) {
        return trainingReviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<TrainingDtos.PendingTrainingReviewResponse> getPendingTrainingReviewsForUser(UUID userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId);
        return enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.CONFIRMED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .filter(e -> !trainingReviewRepository.existsByUserIdAndEnrollmentId(userId, e.getId()))
                .map(e -> TrainingDtos.PendingTrainingReviewResponse.builder()
                        .enrollmentId(e.getId())
                        .courseId(e.getCourse() != null ? e.getCourse().getId() : null)
                        .courseTitle(e.getCourse() != null ? e.getCourse().getTitle() : "Masterclass")
                        .batchId(e.getBatch() != null ? e.getBatch().getId() : null)
                        .batchCode(e.getBatch() != null ? e.getBatch().getBatchCode() : "UPCOMING")
                        .enrolledAt(e.getEnrolledAt())
                        .status(e.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    // --- Training Glimpses / Gallery ---
    @Transactional(readOnly = true)
    public List<TrainingGlimpse> getActiveGlimpses() {
        return trainingGlimpseRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<TrainingGlimpse> getAllGlimpsesForAdmin() {
        return trainingGlimpseRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
    }

    @Transactional
    public TrainingGlimpse saveGlimpse(TrainingDtos.SaveTrainingGlimpseRequest req) {
        TrainingGlimpse glimpse;
        if (req.getId() != null && !req.getId().trim().isEmpty()) {
            glimpse = trainingGlimpseRepository.findById(req.getId())
                    .orElse(new TrainingGlimpse());
            if (glimpse.getId() == null) {
                glimpse.setId(req.getId());
            }
        } else {
            glimpse = new TrainingGlimpse();
            glimpse.setId(UUID.randomUUID().toString());
        }

        glimpse.setTitle(req.getTitle());
        glimpse.setCaption(req.getCaption());
        glimpse.setCourseTitle(req.getCourseTitle());
        glimpse.setLocation(req.getLocation());
        glimpse.setEventDate(req.getEventDate());
        glimpse.setAttendeeCount(req.getAttendeeCount() != null ? req.getAttendeeCount() : 0);
        glimpse.setImageUrl(req.getImageUrl());
        glimpse.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0);
        glimpse.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        return trainingGlimpseRepository.save(glimpse);
    }

    @Transactional
    public void deleteGlimpse(String id) {
        trainingGlimpseRepository.deleteById(id);
    }
}

