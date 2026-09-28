package com.sporekart.training.application;

import com.sporekart.training.domain.*;
import com.sporekart.training.domain.event.EnrollmentConfirmedEvent;
import com.sporekart.training.infrastructure.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TrainingServiceUnitTest {

    @Mock
    private CourseCategoryRepository categoryRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchScheduleRepository scheduleRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private CompletionRepository completionRepository;

    @Mock
    private CertificateRepository certificateRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private TrainingService trainingService;

    @Test
    @DisplayName("TRN-1: createCategory and createCourse persist entities correctly")
    void TRN_1_create_category_and_course_success() {
        UUID categoryId = UUID.randomUUID();
        CourseCategory cat = CourseCategory.builder().id(categoryId).name("Cultivation").slug("cultivation").build();

        when(categoryRepository.save(any(CourseCategory.class))).thenReturn(cat);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(cat));
        when(courseRepository.save(any(Course.class))).thenAnswer(i -> i.getArgument(0));

        CourseCategory createdCat = trainingService.createCategory("Cultivation", "cultivation", "Desc");
        assertNotNull(createdCat);

        Course course = trainingService.createCourse(categoryId, "Button Mushroom", "button-mushroom", "Guide", 10, new BigDecimal("1000.00"));
        assertNotNull(course);
        assertEquals("Button Mushroom", course.getTitle());
        assertTrue(course.isActive());
    }

    @Test
    @DisplayName("TRN-2: getAllActiveCourses auto provisions default batch if missing")
    void TRN_2_get_all_active_courses_auto_provisions_default_batch() {
        UUID courseId = UUID.randomUUID();
        Course course = Course.builder().id(courseId).title("Oyster Mushroom").slug("oyster-mushroom").durationDays(7).feeInr(new BigDecimal("500.00")).isActive(true).build();

        when(courseRepository.findByIsActiveTrue()).thenReturn(List.of(course));
        when(batchRepository.findByCourseId(courseId)).thenReturn(Collections.emptyList());
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));

        List<Course> active = trainingService.getAllActiveCourses();

        assertEquals(1, active.size());
        verify(batchRepository, times(1)).save(any(Batch.class));
    }

    @Test
    @DisplayName("TRN-3: enrollCustomer creates enrollment with PENDING_PAYMENT status")
    void TRN_3_enroll_customer_success() {
        UUID userId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();

        Course course = Course.builder().id(UUID.randomUUID()).feeInr(new BigDecimal("1200.00")).build();
        Batch batch = Batch.builder().id(batchId).course(course).capacity(10).enrolledCount(2).build();

        when(batchRepository.findWithLockById(batchId)).thenReturn(Optional.of(batch));
        when(enrollmentRepository.findByUserIdAndBatchId(userId, batchId)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment enrollment = trainingService.enrollCustomer(userId, batchId);

        assertNotNull(enrollment);
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enrollment.getStatus());
        assertEquals(new BigDecimal("1200.00"), enrollment.getFeePaidInr());
        verify(eventPublisher, times(1)).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("TRN-5: enrollCustomer when batch is full throws IllegalStateException")
    void TRN_5_enroll_customer_batch_full_throws_illegal_state() {
        UUID userId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();
        Batch fullBatch = Batch.builder().id(batchId).batchCode("BATCH-FULL").capacity(5).enrolledCount(5).build();

        when(batchRepository.findWithLockById(batchId)).thenReturn(Optional.of(fullBatch));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                trainingService.enrollCustomer(userId, batchId)
        );

        assertTrue(ex.getMessage().contains("is full"));
    }

    @Test
    @DisplayName("TRN-6: enrollCustomer duplicate attempt returns existing enrollment")
    void TRN_6_enroll_customer_duplicate_returns_existing() {
        UUID userId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();

        Batch batch = Batch.builder().id(batchId).capacity(10).enrolledCount(2).build();
        Enrollment existing = Enrollment.builder().id(UUID.randomUUID()).userId(userId).batch(batch).status(EnrollmentStatus.PENDING_PAYMENT).build();

        when(batchRepository.findWithLockById(batchId)).thenReturn(Optional.of(batch));
        when(enrollmentRepository.findByUserIdAndBatchId(userId, batchId)).thenReturn(Optional.of(existing));

        Enrollment result = trainingService.enrollCustomer(userId, batchId);

        assertEquals(existing.getId(), result.getId());
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("TRN-7: confirmEnrollmentPayment updates status to CONFIRMED and publishes event")
    void TRN_7_confirm_enrollment_payment_success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();

        Course course = Course.builder().id(UUID.randomUUID()).title("Button Mushroom").build();
        Batch batch = Batch.builder().id(batchId).capacity(10).enrolledCount(3).build();

        Enrollment enrollment = Enrollment.builder()
                .id(enrollmentId)
                .userId(UUID.randomUUID())
                .course(course)
                .batch(batch)
                .status(EnrollmentStatus.PENDING_PAYMENT)
                .build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(batchRepository.findWithLockById(batchId)).thenReturn(Optional.of(batch));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment confirmed = trainingService.confirmEnrollmentPayment(enrollmentId, "PAY-REF-123");

        assertEquals(EnrollmentStatus.CONFIRMED, confirmed.getStatus());
        assertEquals("PAY-REF-123", confirmed.getPaymentReference());
        assertEquals(4, batch.getEnrolledCount());
        verify(eventPublisher, times(1)).publishEvent(any(EnrollmentConfirmedEvent.class));
    }

    @Test
    @DisplayName("TRN-8: confirmEnrollmentPayment on already CONFIRMED returns early")
    void TRN_8_confirm_enrollment_payment_already_confirmed_returns_early() {
        UUID enrollmentId = UUID.randomUUID();
        Enrollment confirmed = Enrollment.builder().id(enrollmentId).status(EnrollmentStatus.CONFIRMED).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(confirmed));

        Enrollment result = trainingService.confirmEnrollmentPayment(enrollmentId, "REF-DUP");

        assertEquals(EnrollmentStatus.CONFIRMED, result.getStatus());
        verify(batchRepository, never()).findWithLockById(any());
    }

    @Test
    @DisplayName("TRN-9: confirmEnrollmentPayment when batch becomes full throws IllegalStateException")
    void TRN_9_confirm_enrollment_payment_batch_full_throws_illegal_state() {
        UUID enrollmentId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();

        Batch fullBatch = Batch.builder().id(batchId).capacity(5).enrolledCount(5).build();
        Enrollment enrollment = Enrollment.builder().id(enrollmentId).batch(fullBatch).status(EnrollmentStatus.PENDING_PAYMENT).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(batchRepository.findWithLockById(batchId)).thenReturn(Optional.of(fullBatch));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                trainingService.confirmEnrollmentPayment(enrollmentId, "PAY-FULL")
        );

        assertTrue(ex.getMessage().contains("Batch full"));
    }

    @Test
    @DisplayName("TRN-10: cancelEnrollment under 7 days before start date throws IllegalStateException")
    void TRN_10_cancel_enrollment_under_7_days_throws_illegal_state() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Batch batch = Batch.builder().startDate(LocalDate.now().plusDays(4)).build();
        Enrollment enrollment = Enrollment.builder().id(enrollmentId).userId(userId).batch(batch).status(EnrollmentStatus.CONFIRMED).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                trainingService.cancelEnrollment(enrollmentId, userId, "Cancel short notice")
        );

        assertTrue(ex.getMessage().contains("at least 7 days before"));
    }

    @Test
    @DisplayName("TRN-11: cancelEnrollment >7 days before start date sets status to CANCELLED and decrements enrolled count")
    void TRN_11_cancel_enrollment_future_batch_success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Batch batch = Batch.builder().startDate(LocalDate.now().plusDays(10)).enrolledCount(3).build();
        Enrollment enrollment = Enrollment.builder().id(enrollmentId).userId(userId).batch(batch).status(EnrollmentStatus.CONFIRMED).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment cancelled = trainingService.cancelEnrollment(enrollmentId, userId, "Plans changed");

        assertEquals(EnrollmentStatus.CANCELLED, cancelled.getStatus());
        assertEquals(2, batch.getEnrolledCount());
    }

    @Test
    @DisplayName("TRN-12: cancelEnrollment by wrong user throws IllegalArgumentException")
    void TRN_12_cancel_enrollment_wrong_user_throws_illegal_argument() {
        UUID enrollmentId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();

        Enrollment enrollment = Enrollment.builder().id(enrollmentId).userId(ownerId).build();
        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                trainingService.cancelEnrollment(enrollmentId, attackerId, "Malicious cancel")
        );

        assertTrue(ex.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("TRN-13: markAttendance saves attendance with present flag and timestamp")
    void TRN_13_mark_attendance_success() {
        UUID enrollmentId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();

        Enrollment enrollment = Enrollment.builder().id(enrollmentId).build();
        BatchSchedule schedule = BatchSchedule.builder().id(scheduleId).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(schedule));
        when(attendanceRepository.findByEnrollmentIdAndScheduleId(enrollmentId, scheduleId)).thenReturn(Optional.empty());
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> i.getArgument(0));

        Attendance att = trainingService.markAttendance(enrollmentId, scheduleId, true);

        assertNotNull(att);
        assertTrue(att.isPresent());
        assertNotNull(att.getMarkedAt());
    }

    @Test
    @DisplayName("TRN-14: completeCourseAndIssueCertificate issues certificate with CERT- prefix and updates status")
    void TRN_14_complete_course_and_issue_certificate_success() {
        UUID enrollmentId = UUID.randomUUID();
        Course course = Course.builder().id(UUID.randomUUID()).build();
        Enrollment enrollment = Enrollment.builder().id(enrollmentId).course(course).userId(UUID.randomUUID()).status(EnrollmentStatus.CONFIRMED).build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(completionRepository.save(any(Completion.class))).thenAnswer(i -> i.getArgument(0));
        when(certificateRepository.save(any(Certificate.class))).thenAnswer(i -> i.getArgument(0));

        Certificate cert = trainingService.completeCourseAndIssueCertificate(enrollmentId, "PASS");

        assertNotNull(cert);
        assertTrue(cert.getCertificateCode().startsWith("CERT-"));
        assertEquals(EnrollmentStatus.COMPLETED, enrollment.getStatus());
    }

    @Test
    @DisplayName("TRN-15: completeCourse on already COMPLETED returns existing certificate")
    void TRN_15_complete_course_already_completed_returns_existing_certificate() {
        UUID enrollmentId = UUID.randomUUID();
        Enrollment completed = Enrollment.builder().id(enrollmentId).status(EnrollmentStatus.COMPLETED).build();
        Certificate existingCert = Certificate.builder().certificateCode("CERT-EXISTING-123").build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(completed));
        when(certificateRepository.findByEnrollmentId(enrollmentId)).thenReturn(Optional.of(existingCert));

        Certificate cert = trainingService.completeCourseAndIssueCertificate(enrollmentId, "PASS");

        assertEquals("CERT-EXISTING-123", cert.getCertificateCode());
        verify(completionRepository, never()).save(any());
    }
}
