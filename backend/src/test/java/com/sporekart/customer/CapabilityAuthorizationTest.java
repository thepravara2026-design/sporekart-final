package com.sporekart.customer;

import com.sporekart.customer.api.CustomerDtos;
import com.sporekart.customer.application.CapabilityService;
import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerCapability;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.Batch;
import com.sporekart.training.domain.Course;
import com.sporekart.training.domain.CourseCategory;
import com.sporekart.training.domain.Enrollment;
import com.sporekart.training.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CapabilityAuthorizationTest {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CapabilityService capabilityService;

    @Autowired
    private TrainingService trainingService;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    private UUID userId;
    private Course testCourse;
    private Batch testBatch;

    @BeforeEach
    void setUp() {
        certificateRepository.deleteAll();
        enrollmentRepository.deleteAll();
        batchRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();

        userId = UUID.randomUUID();

        CourseCategory category = trainingService.createCategory("Mushroom Cultivation", "mushroom-cultivation", "Cultivation courses");
        testCourse = trainingService.createCourse(
                category.getId(),
                "Button Mushroom Mastery",
                "button-mushroom-mastery",
                "Advanced cultivation techniques",
                14,
                new BigDecimal("2500.00")
        );

        testBatch = trainingService.createBatch(
                testCourse.getId(),
                "BATCH-BUTTON-2026-01",
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(17),
                10
        );
    }

    @Test
    @Transactional
    void testDefaultCustomerCapabilities() {
        CustomerProfile profile = customerService.getOrCreateProfile(userId);
        assertNotNull(profile);

        Set<CustomerCapability> capabilities = capabilityService.getUserCapabilities(userId);
        assertTrue(capabilities.contains(CustomerCapability.SHOP));
        assertTrue(capabilities.contains(CustomerCapability.ORDER));
        assertTrue(capabilities.contains(CustomerCapability.SUPPORT));
        assertFalse(capabilities.contains(CustomerCapability.TRAINING));

        assertTrue(capabilityService.hasCapability(userId, CustomerCapability.SHOP));
        assertTrue(capabilityService.hasCapability(userId, "SHOP"));
        assertFalse(capabilityService.hasCapability(userId, CustomerCapability.TRAINING));
        assertFalse(capabilityService.hasCapability(userId, "TRAINING"));
    }

    @Test
    @Transactional
    void testCapabilityUpgradeOnEnrollmentConfirmed() {
        // Step 1: Add address and update profile to verify data preservation
        CustomerDtos.AddressRequest addressReq = new CustomerDtos.AddressRequest();
        addressReq.setRecipientName("John Mushroomer");
        addressReq.setPhone("9876543210");
        addressReq.setLine1("123 Fungi Lane");
        addressReq.setCity("Pune");
        addressReq.setState("Maharashtra");
        addressReq.setPincode("411001");
        addressReq.setDefault(true);
        customerService.addAddress(userId, addressReq);

        CustomerDtos.UpdateProfileRequest updateReq = new CustomerDtos.UpdateProfileRequest();
        updateReq.setGstin("27AAAAA0000A1Z5");
        updateReq.setFarmSizeSqft(5000);
        customerService.updateProfile(userId, updateReq);

        // Step 2: Enroll in training batch
        Enrollment enrollment = trainingService.enrollCustomer(userId, testBatch.getId());
        assertNotNull(enrollment);

        // Verify no TRAINING capability yet
        assertFalse(capabilityService.hasCapability(userId, CustomerCapability.TRAINING));

        // Step 3: Confirm Payment -> triggers EnrollmentConfirmedEvent
        trainingService.confirmEnrollmentPayment(enrollment.getId(), "PAY_REF_CAPABILITY_TEST");

        // Verify TRAINING capability is granted
        assertTrue(capabilityService.hasCapability(userId, CustomerCapability.TRAINING));
        Set<CustomerCapability> updatedCapabilities = capabilityService.getUserCapabilities(userId);
        assertTrue(updatedCapabilities.contains(CustomerCapability.SHOP));
        assertTrue(updatedCapabilities.contains(CustomerCapability.ORDER));
        assertTrue(updatedCapabilities.contains(CustomerCapability.SUPPORT));
        assertTrue(updatedCapabilities.contains(CustomerCapability.TRAINING));

        // Step 4: Verify existing customer profile data, identity, and addresses remain intact
        CustomerProfile profileAfter = customerService.getCustomerProfile(userId);
        assertEquals(userId, profileAfter.getUserId());
        assertEquals("27AAAAA0000A1Z5", profileAfter.getGstin());
        assertEquals(5000, profileAfter.getFarmSizeSqft());
        assertTrue(profileAfter.isHasTrainingCapability());

        List<CustomerDtos.AddressDto> addresses = customerService.getAddresses(userId);
        assertEquals(1, addresses.size());
        assertEquals("John Mushroomer", addresses.get(0).getRecipientName());
        assertEquals("123 Fungi Lane", addresses.get(0).getLine1());
    }

    @Test
    @Transactional
    void testExplicitCapabilityGranting() {
        CustomerProfile profile = customerService.getOrCreateProfile(userId);
        assertFalse(capabilityService.hasCapability(userId, CustomerCapability.TRAINING));

        capabilityService.grantCapability(userId, CustomerCapability.TRAINING);
        assertTrue(capabilityService.hasCapability(userId, CustomerCapability.TRAINING));
    }
}
