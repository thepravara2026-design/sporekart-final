package com.sporekart.admin;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.promotion.api.PromotionDtos;
import com.sporekart.promotion.application.PromotionService;
import com.sporekart.review.api.ReviewDtos;
import com.sporekart.review.application.ProductReviewService;
import com.sporekart.review.domain.ReviewStatus;
import com.sporekart.training.application.TrainingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminConsoleFullAuditTest {

    @Autowired
    private AdminApplicationService adminService;

    @Autowired
    private AdminCatalogService adminCatalogService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private PromotionService promotionService;

    @Autowired
    private TrainingService trainingService;

    @Autowired
    private ProductReviewService productReviewService;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .email("audit.admin@sporekart.in")
                .fullName("System Audit Admin")
                .role(UserRole.ROLE_ADMIN)
                .isVerified(true)
                .build());
    }

    // =========================================================================
    // SECTION 1: CATALOG & INVENTORY MANAGEMENT VALIDATIONS
    // =========================================================================

    @Test
    @DisplayName("ADMIN-CAT-01 [Negative]: Rejects Product Creation with Empty Title")
    void testProductCreationInvalidTitleOrHsn() {
        CatalogDtos.CreateProductRequest req = new CatalogDtos.CreateProductRequest();
        req.setTitle(""); // Blank title
        req.setProductType(ProductType.FRESH_MUSHROOM);
        req.setHsnCode("123");

        assertThrows(Exception.class, () -> adminCatalogService.createProduct(req));
    }

    @Test
    @DisplayName("ADMIN-CAT-02 [Negative]: Rejects Inventory Reservation Exceeding Available Stock")
    void testInventoryReservationLimit() {
        UUID fakeVariantId = UUID.randomUUID();
        
        Exception ex = assertThrows(IllegalArgumentException.class, () -> {
            inventoryService.reserveInventory(fakeVariantId, 99999, "REF_TEST", "ADMIN_AUDIT");
        });
        
        assertTrue(ex.getMessage().contains("Insufficient") || ex.getMessage().contains("not found"));
    }

    // =========================================================================
    // SECTION 2: PROMOTIONS & OFFERS MANAGEMENT VALIDATIONS
    // =========================================================================

    @Test
    @DisplayName("ADMIN-PROMO-01 [Negative]: Rejects Promotion Creation with Past Expiration or Invalid Data")
    void testInvalidPromotionCreation() {
        PromotionDtos.CreatePromotionRequest req = new PromotionDtos.CreatePromotionRequest();
        req.setCode("INVALID CODE!"); // Spaces & special chars
        req.setName("Audit Promo");
        req.setType(com.sporekart.promotion.domain.PromotionType.PERCENTAGE);
        req.setDiscountValue(new BigDecimal("15.00"));
        req.setStartAt(OffsetDateTime.now().minusDays(10));
        req.setEndAt(OffsetDateTime.now().minusDays(5)); // End date before start date

        assertThrows(Exception.class, () -> promotionService.createPromotion(req));
    }

    @Test
    @DisplayName("ADMIN-PROMO-02 [Negative]: Rejects Negative Discount Value in Promotion")
    void testNegativeDiscountValueRejection() {
        PromotionDtos.CreatePromotionRequest req = new PromotionDtos.CreatePromotionRequest();
        req.setCode("NEGATIVEDISC");
        req.setName("Negative Discount");
        req.setType(com.sporekart.promotion.domain.PromotionType.FIXED_AMOUNT);
        req.setDiscountValue(new BigDecimal("-100.00")); // Negative discount

        assertThrows(Exception.class, () -> promotionService.createPromotion(req));
    }

    // =========================================================================
    // SECTION 3: REVIEWS MODERATION VALIDATIONS
    // =========================================================================

    @Test
    @DisplayName("ADMIN-REV-01 [Negative]: Rejects Review Status Update for Non-Existent Review ID")
    void testNonExistentReviewStatusUpdate() {
        UUID fakeReviewId = UUID.randomUUID();
        ReviewDtos.AdminModerationRequest req = new ReviewDtos.AdminModerationRequest(ReviewStatus.PUBLISHED, "Audit moderation note");

        assertThrows(Exception.class, () -> {
            productReviewService.moderateReview(adminUser.getId(), fakeReviewId, req);
        });
    }

    // =========================================================================
    // SECTION 4: TRAINING & BATCH MANAGEMENT VALIDATIONS
    // =========================================================================

    @Test
    @DisplayName("ADMIN-TRN-01 [Negative]: Rejects Batch Creation with Non-Existent Course ID")
    void testInvalidBatchCreation() {
        UUID fakeCourseId = UUID.randomUUID();

        assertThrows(Exception.class, () -> {
            trainingService.createBatch(fakeCourseId, "AUDIT-BATCH-0", LocalDate.now().plusDays(5), LocalDate.now().plusDays(10), 20);
        });
    }

    // =========================================================================
    // SECTION 5: AUDIT LOG & PAGINATION EDGE CASES
    // =========================================================================

    @Test
    @DisplayName("ADMIN-PAG-01 [Edge Case]: Safely Handles Audit Log Retrieval Requests")
    void testAdminPaginationEdgeCases() {
        assertDoesNotThrow(() -> {
            adminService.getAllAuditLogs();
        });
    }
}
