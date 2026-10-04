package com.sporekart.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import com.sporekart.training.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class VerifyEnrollmentBypassReproductionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TrainingService trainingService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private UUID victimUserId;
    private UUID attackerUserId;
    private String victimToken;
    private String attackerToken;
    private Enrollment pendingEnrollment;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        batchRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
        paymentRepository.deleteAll();

        victimUserId = UUID.randomUUID();
        attackerUserId = UUID.randomUUID();

        customerService.getOrCreateProfile(victimUserId);
        customerService.getOrCreateProfile(attackerUserId);

        victimToken = jwtTokenProvider.generateToken(victimUserId, "victim@sporekart.in", "ROLE_CUSTOMER");
        attackerToken = jwtTokenProvider.generateToken(attackerUserId, "attacker@sporekart.in", "ROLE_CUSTOMER");

        CourseCategory category = trainingService.createCategory("Cultivation", "cultivation", "Mushroom Cultivation");
        Course course = trainingService.createCourse(
                category.getId(),
                "Button Mushroom Masterclass",
                "button-mushroom-masterclass",
                "Learn button mushroom farming",
                14,
                new BigDecimal("4999.00")
        );

        Batch batch = trainingService.createBatch(
                course.getId(),
                "BATCH-BTN-2026-01",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(24),
                20
        );

        pendingEnrollment = trainingService.enrollCustomer(victimUserId, batch.getId());
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, pendingEnrollment.getStatus());
    }

    @Test
    @DisplayName("Fix Verification 1: Unauthenticated POST /payment/verify-enrollment is REJECTED (403/401)")
    void testUnauthenticatedVerifyEnrollmentIsRejected() throws Exception {
        PaymentDtos.VerifyEnrollmentPaymentRequest requestPayload = PaymentDtos.VerifyEnrollmentPaymentRequest.builder()
                .enrollmentId(pendingEnrollment.getId())
                .transactionReference("FABRICATED-TX-REF-UNAUTH")
                .paymentMethod("MOCK_PAYMENT")
                .build();

        mockMvc.perform(post("/payment/verify-enrollment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestPayload)))
                .andExpect(status().isUnauthorized());

        Enrollment enrollmentAfter = enrollmentRepository.findById(pendingEnrollment.getId()).orElseThrow();
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enrollmentAfter.getStatus(), "Unauthenticated attack must not confirm enrollment!");
    }

    @Test
    @DisplayName("Fix Verification 2: Attacker verifying another user's enrollment is REJECTED with 403 Forbidden")
    void testAttackerAccessDeniedOnOtherUserEnrollment() throws Exception {
        PaymentDtos.VerifyEnrollmentPaymentRequest requestPayload = PaymentDtos.VerifyEnrollmentPaymentRequest.builder()
                .enrollmentId(pendingEnrollment.getId())
                .transactionReference("FABRICATED-TX-REF-ATTACKER")
                .paymentMethod("MOCK_PAYMENT")
                .build();

        mockMvc.perform(post("/payment/verify-enrollment")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestPayload)))
                .andExpect(status().isForbidden());

        Enrollment enrollmentAfter = enrollmentRepository.findById(pendingEnrollment.getId()).orElseThrow();
        assertEquals(EnrollmentStatus.PENDING_PAYMENT, enrollmentAfter.getStatus(), "Attacker must not be able to confirm victim's enrollment!");
    }

    @Test
    @DisplayName("Fix Verification 3: Missing transaction reference is REJECTED with 400 Bad Request")
    void testMissingTransactionReferenceIsRejected() throws Exception {
        PaymentDtos.VerifyEnrollmentPaymentRequest requestPayload = PaymentDtos.VerifyEnrollmentPaymentRequest.builder()
                .enrollmentId(pendingEnrollment.getId())
                .transactionReference("   ")
                .paymentMethod("MOCK_PAYMENT")
                .build();

        mockMvc.perform(post("/payment/verify-enrollment")
                        .header("Authorization", "Bearer " + victimToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestPayload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Fix Verification 4: Legitimate owner with valid transaction reference SUCCEEDS and persists Payment audit entity")
    void testLegitimateOwnerVerifyEnrollmentSucceeds() throws Exception {
        String txRef = "TXN-VALID-RAZORPAY-98765";
        PaymentDtos.VerifyEnrollmentPaymentRequest requestPayload = PaymentDtos.VerifyEnrollmentPaymentRequest.builder()
                .enrollmentId(pendingEnrollment.getId())
                .transactionReference(txRef)
                .paymentMethod("RAZORPAY")
                .build();

        MvcResult mvcResult = mockMvc.perform(post("/payment/verify-enrollment")
                        .header("Authorization", "Bearer " + victimToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestPayload)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = mvcResult.getResponse().getContentAsString();
        PaymentDtos.VerifyEnrollmentPaymentResponse response = objectMapper.readValue(
                objectMapper.readTree(responseContent).path("data").toString(),
                PaymentDtos.VerifyEnrollmentPaymentResponse.class
        );

        assertTrue(response.isSuccess());
        assertEquals(pendingEnrollment.getId(), response.getEnrollmentId());
        assertEquals(txRef, response.getPaymentReference());

        // Verify Enrollment is confirmed
        Enrollment updatedEnrollment = enrollmentRepository.findById(pendingEnrollment.getId()).orElseThrow();
        assertEquals(EnrollmentStatus.CONFIRMED, updatedEnrollment.getStatus());
        assertEquals(txRef, updatedEnrollment.getPaymentReference());

        // Verify Customer training capability is granted
        CustomerProfile profile = customerService.getCustomerProfile(victimUserId);
        assertTrue(profile.isHasTrainingCapability());

        // Verify Payment audit entity is saved in DB!
        Optional<Payment> savedPayment = paymentRepository.findByRazorpayPaymentId(txRef);
        assertTrue(savedPayment.isPresent(), "Payment entity must be persisted for financial auditing!");
        assertEquals(txRef, savedPayment.get().getRazorpayPaymentId());
        assertEquals(new BigDecimal("4999.00"), savedPayment.get().getAmountInr());
    }
}
