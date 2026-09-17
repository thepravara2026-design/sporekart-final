package com.sporekart.training;

import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import com.sporekart.training.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TrainingModuleTest {

    @Autowired
    private TrainingService trainingService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private BatchScheduleRepository scheduleRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CompletionRepository completionRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    private UUID userId;
    private Course testCourse;
    private Batch testBatch;

    @BeforeEach
    void setUp() {
        certificateRepository.deleteAll();
        completionRepository.deleteAll();
        attendanceRepository.deleteAll();
        enrollmentRepository.deleteAll();
        scheduleRepository.deleteAll();
        batchRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();

        userId = UUID.randomUUID();
        customerService.getOrCreateProfile(userId);

        CourseCategory category = trainingService.createCategory("Cultivation", "cultivation", "Mushroom Cultivation Courses");
        testCourse = trainingService.createCourse(
                category.getId(),
                "Oyster Mushroom Cultivation Masterclass",
                "oyster-mushroom-masterclass",
                "Complete hands-on guide to growing oyster mushrooms",
                7,
                new BigDecimal("1500.00")
        );

        testBatch = trainingService.createBatch(
                testCourse.getId(),
                "BATCH-OYSTER-2026-01",
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(12),
                2
        );

        trainingService.addBatchSchedule(
                testBatch.getId(),
                "Substrate Preparation & Sterilization",
                ZonedDateTime.now().plusDays(5),
                120,
                "https://meet.google.com/abc-defg-hij"
        );
    }

    @Test
    void testCourseAndBatchListing() {
        List<Course> courses = trainingService.getAllActiveCourses();
        assertEquals(1, courses.size());
        assertEquals("Oyster Mushroom Cultivation Masterclass", courses.get(0).getTitle());

        List<Batch> batches = trainingService.getBatchesForCourse(testCourse.getId());
        assertEquals(1, batches.size());
        assertEquals(2, batches.get(0).getCapacity());
        assertEquals(0, batches.get(0).getEnrolledCount());
    }

    @Test
    void testEnrollmentAndEventDrivenCustomerCapability() {
        // Step 1: Enroll Customer (PENDING_PAYMENT)
        Enrollment enrollment = trainingService.enrollCustomer(userId, testBatch.getId());
        assertNotNull(enrollment);
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enrollment.getStatus());

        // Initial check: Customer does not have training capability yet
        CustomerProfile profileBefore = customerService.getCustomerProfile(userId);
        assertFalse(profileBefore.isHasTrainingCapability());

        // Step 2: Confirm Payment -> triggers EnrollmentConfirmedEvent
        Enrollment confirmedEnrollment = trainingService.confirmEnrollmentPayment(enrollment.getId(), "RAZORPAY_PAY_REF_999");
        assertEquals(EnrollmentStatus.CONFIRMED, confirmedEnrollment.getStatus());
        assertEquals("RAZORPAY_PAY_REF_999", confirmedEnrollment.getPaymentReference());

        // Verify batch enrolled count updated
        Batch updatedBatch = batchRepository.findById(testBatch.getId()).orElseThrow();
        assertEquals(1, updatedBatch.getEnrolledCount());

        // Verify Event Listener granted TRAINING capability to Customer domain!
        CustomerProfile profileAfter = customerService.getCustomerProfile(userId);
        assertTrue(profileAfter.isHasTrainingCapability());
        assertNotNull(profileAfter.getTrainingCapabilityGrantedAt());
    }

    @Test
    void testBatchCapacityEnforcement() {
        UUID user2 = UUID.randomUUID();
        UUID user3 = UUID.randomUUID();

        Enrollment e1 = trainingService.enrollCustomer(userId, testBatch.getId());
        trainingService.confirmEnrollmentPayment(e1.getId(), "PAY_1");

        Enrollment e2 = trainingService.enrollCustomer(user2, testBatch.getId());
        trainingService.confirmEnrollmentPayment(e2.getId(), "PAY_2");

        Batch fullBatch = batchRepository.findById(testBatch.getId()).orElseThrow();
        assertEquals(2, fullBatch.getEnrolledCount());
        assertFalse(fullBatch.hasAvailableCapacity());

        // 3rd Enrollment attempt must fail with capacity exception
        assertThrows(IllegalStateException.class, () -> {
            trainingService.enrollCustomer(user3, testBatch.getId());
        });
    }

    @Test
    void testAttendanceCompletionAndCertificateIssuance() {
        Enrollment enrollment = trainingService.enrollCustomer(userId, testBatch.getId());
        trainingService.confirmEnrollmentPayment(enrollment.getId(), "PAY_REF_CERT");

        BatchSchedule schedule = scheduleRepository.findByBatchIdOrderByScheduledAtAsc(testBatch.getId()).get(0);
        Attendance attendance = trainingService.markAttendance(enrollment.getId(), schedule.getId(), true);
        assertTrue(attendance.isPresent());

        Certificate cert = trainingService.completeCourseAndIssueCertificate(enrollment.getId(), "DISTINCTION");
        assertNotNull(cert);
        assertNotNull(cert.getCertificateCode());
        assertTrue(cert.getCertificateCode().startsWith("CERT-"));
        assertNotNull(cert.getCertificateUrl());

        Enrollment completedEnrollment = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        assertEquals(EnrollmentStatus.COMPLETED, completedEnrollment.getStatus());
    }
}
