package com.sporekart.review;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderItem;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.review.api.ReviewDtos;
import com.sporekart.review.domain.ReviewStatus;
import com.sporekart.review.application.ProductReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductReviewServiceTest {

    @Autowired
    private ProductReviewService reviewService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User testCustomer;
    private User otherCustomer;
    private User adminUser;
    private Product testProduct;
    private ProductVariant testVariant;
    private Order deliveredOrder;
    private OrderItem deliveredItem;

    @BeforeEach
    void setUp() {
        testCustomer = userRepository.save(User.builder()
                .fullName("Ananya Sharma")
                .email("ananya_" + UUID.randomUUID() + "@example.com")
                .phone("9198765432" + (int)(Math.random()*90 + 10))
                .role(UserRole.ROLE_CUSTOMER)
                .isVerified(true)
                .build());

        otherCustomer = userRepository.save(User.builder()
                .fullName("Rahul Verma")
                .email("rahul_" + UUID.randomUUID() + "@example.com")
                .phone("9198765431" + (int)(Math.random()*90 + 10))
                .role(UserRole.ROLE_CUSTOMER)
                .isVerified(true)
                .build());

        adminUser = userRepository.save(User.builder()
                .fullName("Admin User")
                .email("admin_" + UUID.randomUUID() + "@sporekart.in")
                .phone("9199999999" + (int)(Math.random()*90 + 10))
                .role(UserRole.ROLE_ADMIN)
                .isVerified(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .title("Oyster Mushroom Grow Kit")
                .slug("oyster-grow-kit-" + UUID.randomUUID())
                .description("Premium indoor oyster mushroom growing kit")
                .productType(ProductType.GROWING_KIT)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        testVariant = variantRepository.save(ProductVariant.builder()
                .product(testProduct)
                .variantName("1 Kg Box")
                .sku("GROW-OYSTER-1KG-" + UUID.randomUUID())
                .priceInr(new BigDecimal("599.00"))
                .stockQuantity(100)
                .isActive(true)
                .build());

        deliveredOrder = Order.builder()
                .userId(testCustomer.getId())
                .orderNumber("ORD-REV-" + UUID.randomUUID().toString().substring(0, 8))
                .subtotalAmountInr(new BigDecimal("599.00"))
                .totalAmountInr(new BigDecimal("599.00"))
                .status(OrderStatus.DELIVERED)
                .shippingAddressJson("{\"city\":\"Bengaluru\",\"state\":\"Karnataka\"}")
                .build();

        deliveredItem = OrderItem.builder()
                .variantId(testVariant.getId())
                .productTitle(testProduct.getTitle())
                .variantName(testVariant.getVariantName())
                .sku(testVariant.getSku())
                .priceInr(testVariant.getPriceInr())
                .quantity(1)
                .lineTotalInr(testVariant.getPriceInr())
                .build();

        deliveredOrder.addItem(deliveredItem);
        deliveredOrder = orderRepository.save(deliveredOrder);
        deliveredItem = deliveredOrder.getItems().get(0);
    }

    @Test
    void testCreateReview_Success_DeliveredOrder() {
        ReviewDtos.CreateReviewRequest req = ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(5)
                .reviewTitle("Amazing Harvest!")
                .reviewText("Harvested delicious mushrooms in just 7 days. High quality substrate!")
                .imageUrls(List.of("https://media.sporekart.in/customer-photo-1.jpg"))
                .build();

        ReviewDtos.ReviewResponse res = reviewService.createReview(testCustomer.getId(), req);

        assertNotNull(res);
        assertNotNull(res.getId());
        assertEquals(5, res.getRating());
        assertEquals("Amazing Harvest!", res.getReviewTitle());
        assertTrue(res.isVerifiedPurchase());
        assertEquals(ReviewStatus.PUBLISHED, res.getStatus());
        assertTrue(res.isHasCustomerImages());
        assertEquals(1, res.getCustomerImages().size());
        assertEquals("https://media.sporekart.in/customer-photo-1.jpg", res.getPrimaryImageUrl());
    }

    @Test
    void testCreateReview_Failure_UndeliveredOrder() {
        Order shippedOrder = orderRepository.save(Order.builder()
                .userId(testCustomer.getId())
                .orderNumber("ORD-SHP-" + UUID.randomUUID().toString().substring(0, 8))
                .subtotalAmountInr(new BigDecimal("599.00"))
                .totalAmountInr(new BigDecimal("599.00"))
                .status(OrderStatus.SHIPPED)
                .shippingAddressJson("{}")
                .build());

        OrderItem shippedItem = OrderItem.builder()
                .variantId(testVariant.getId())
                .productTitle(testProduct.getTitle())
                .variantName(testVariant.getVariantName())
                .priceInr(testVariant.getPriceInr())
                .quantity(1)
                .build();

        shippedOrder.addItem(shippedItem);
        shippedOrder = orderRepository.save(shippedOrder);

        ReviewDtos.CreateReviewRequest req = ReviewDtos.CreateReviewRequest.builder()
                .orderId(shippedOrder.getId())
                .orderItemId(shippedOrder.getItems().get(0).getId())
                .rating(4)
                .reviewText("Good product but not delivered yet.")
                .build();

        assertThrows(IllegalStateException.class, () -> reviewService.createReview(testCustomer.getId(), req));
    }

    @Test
    void testCreateReview_Failure_UnauthorizedCustomer() {
        ReviewDtos.CreateReviewRequest req = ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(5)
                .reviewText("Trying to review someone else's order")
                .build();

        assertThrows(IllegalStateException.class, () -> reviewService.createReview(otherCustomer.getId(), req));
    }

    @Test
    void testCreateReview_Failure_DuplicateSubmission() {
        ReviewDtos.CreateReviewRequest req = ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(5)
                .reviewText("First review submission text here.")
                .build();

        reviewService.createReview(testCustomer.getId(), req);

        // Attempting second submission for same order item
        assertThrows(IllegalStateException.class, () -> reviewService.createReview(testCustomer.getId(), req));
    }

    @Test
    void testCreateReview_Failure_InvalidRating() {
        ReviewDtos.CreateReviewRequest req0 = ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(0)
                .reviewText("Zero star rating test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> reviewService.createReview(testCustomer.getId(), req0));

        ReviewDtos.CreateReviewRequest req6 = ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(6)
                .reviewText("Six star rating test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> reviewService.createReview(testCustomer.getId(), req6));
    }

    @Test
    void testGetProductReviewSummary_CalculatesAverageAndDistribution() {
        reviewService.createReview(testCustomer.getId(), ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(5)
                .reviewText("Excellent oyster kit, fresh yield.")
                .build());

        ReviewDtos.ProductReviewSummary summary = reviewService.getProductReviewSummary(testProduct.getId());

        assertNotNull(summary);
        assertEquals(1, summary.getTotalReviews());
        assertEquals(5.0, summary.getAverageRating());
        assertEquals(1L, summary.getRatingDistribution().get(5));
        assertEquals(0L, summary.getRatingDistribution().get(1));
    }

    @Test
    void testAdminModeration_UpdatesStatusAndExcludesFromPublic() {
        ReviewDtos.ReviewResponse reviewRes = reviewService.createReview(testCustomer.getId(), ReviewDtos.CreateReviewRequest.builder()
                .orderId(deliveredOrder.getId())
                .orderItemId(deliveredItem.getId())
                .rating(1)
                .reviewText("Testing unpublishing review")
                .build());

        // Admin hides the review
        ReviewDtos.ReviewResponse moderated = reviewService.moderateReview(
                adminUser.getId(),
                reviewRes.getId(),
                ReviewDtos.AdminModerationRequest.builder()
                        .status(ReviewStatus.HIDDEN)
                        .moderationReason("Contains inappropriate language")
                        .build()
        );

        assertEquals(ReviewStatus.HIDDEN, moderated.getStatus());
        assertEquals("Contains inappropriate language", moderated.getModerationReason());

        // Public review query should be empty
        List<ReviewDtos.ReviewResponse> latest = reviewService.getLatestPublishedReviews(5);
        assertTrue(latest.stream().noneMatch(r -> r.getId().equals(reviewRes.getId())));
    }
}
