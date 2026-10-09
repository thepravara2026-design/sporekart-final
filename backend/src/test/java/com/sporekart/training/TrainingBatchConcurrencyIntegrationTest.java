package com.sporekart.training;

import com.sporekart.customer.application.CustomerService;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import com.sporekart.training.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TrainingBatchConcurrencyIntegrationTest {

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
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CompletionRepository completionRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private TrainingReviewRepository trainingReviewRepository;

    private Course testCourse;
    private Batch testBatch;

    @BeforeEach
    void setUp() {
        trainingReviewRepository.deleteAll();
        certificateRepository.deleteAll();
        completionRepository.deleteAll();
        attendanceRepository.deleteAll();
        enrollmentRepository.deleteAll();
        batchRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();

        CourseCategory category = trainingService.createCategory("Cultivation", "cultivation", "Mushroom Cultivation Courses");
        testCourse = trainingService.createCourse(
                category.getId(),
                "Advanced Mycology Masterclass",
                "advanced-mycology-masterclass",
                "High capacity training test course",
                7,
                new BigDecimal("2000.00")
        );

        // Strict capacity limit: 3 seats only!
        testBatch = trainingService.createBatch(
                testCourse.getId(),
                "CONCURRENCY-BATCH-001",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(17),
                3
        );
    }

    @Test
    @DisplayName("Concurrent Enrollment Test: 10 threads competing for 3 seats must result in exactly 3 successful enrollments and zero oversubscription")
    void testConcurrentEnrollmentCapacityEnforcement() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger capacityExceededCount = new AtomicInteger(0);
        List<Exception> capturedExceptions = Collections.synchronizedList(new ArrayList<>());

        List<UUID> userIds = new ArrayList<>();
        for (int i = 0; i < numberOfThreads; i++) {
            UUID userId = UUID.randomUUID();
            customerService.getOrCreateProfile(userId);
            userIds.add(userId);
        }

        for (int i = 0; i < numberOfThreads; i++) {
            final UUID userId = userIds.get(i);
            final String payRef = "PAY_REF_CONCURRENCY_" + i;

            executorService.submit(() -> {
                try {
                    latch.await(); // Simultaneous start line for all threads
                    Enrollment enrollment = trainingService.enrollCustomer(userId, testBatch.getId());
                    trainingService.confirmEnrollmentPayment(enrollment.getId(), payRef);
                    successCount.incrementAndGet();
                } catch (IllegalStateException ex) {
                    capacityExceededCount.incrementAndGet();
                    capturedExceptions.add(ex);
                } catch (Exception ex) {
                    capturedExceptions.add(ex);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Release all threads simultaneously
        latch.countDown();
        boolean completedInTime = doneLatch.await(15, TimeUnit.SECONDS);
        executorService.shutdown();

        assertTrue(completedInTime, "All concurrent enrollment threads should finish execution within timeout");

        // Verify Database Ground Truth
        Batch refreshedBatch = batchRepository.findById(testBatch.getId()).orElseThrow();
        assertEquals(3, refreshedBatch.getEnrolledCount(), "Batch enrolledCount must equal maximum capacity of 3");
        assertEquals(3, successCount.get(), "Exactly 3 threads should successfully complete enrollment and payment confirmation");
        assertEquals(7, capacityExceededCount.get(), "Exactly 7 threads should fail with capacity exceeded exceptions");

        // Verify total confirmed enrollments in DB
        List<Enrollment> confirmedEnrollments = enrollmentRepository.findAll().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.CONFIRMED)
                .toList();
        assertEquals(3, confirmedEnrollments.size(), "Database must contain exactly 3 CONFIRMED enrollment records");
    }
}
