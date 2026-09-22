package com.sporekart.cart;

import com.sporekart.cart.api.dto.*;
import com.sporekart.cart.application.CartService;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.ProductOfferRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CartServiceTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private AdminCatalogService adminCatalogService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductOfferRepository offerRepository;

    private Product testProduct;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        offerRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(
                null, "Fresh Oyster " + uniqueSuffix, "fresh-oyster-" + uniqueSuffix,
                "Fresh Oyster Mushrooms", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE,
                "0709", new BigDecimal("5.00"), "Meta", "Desc", "url", true
        );
        testProduct = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest varReq = new CatalogDtos.CreateVariantRequest(
                "200g Pack", "SKU-OYSTER-200G-" + uniqueSuffix, new BigDecimal("100.00"),
                new BigDecimal("120.00"), 20, true
        );
        testVariant = adminCatalogService.addVariant(testProduct.getId(), varReq);
    }

    @Test
    void testGuestCartAddItemAndCalculateTotals() {
        String sessionId = "session-" + UUID.randomUUID();

        CartResponse cart = cartService.addItemToCart(null, sessionId, testVariant.getId(), 2);

        assertNotNull(cart);
        assertEquals(sessionId, cart.getSessionId());
        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItemCount());
        // Unit price = net 100 + 5% GST = 105.00
        // Line total for 2 items = 210.00
        assertEquals(new BigDecimal("210.00"), cart.getEstimatedTotalInr());
        assertTrue(cart.isValid());
    }

    @Test
    void testExceedingStockThrowsException() {
        String sessionId = "session-" + UUID.randomUUID();

        Exception ex = assertThrows(IllegalStateException.class, () ->
                cartService.addItemToCart(null, sessionId, testVariant.getId(), 25)
        );

        assertTrue(ex.getMessage().contains("exceeds available stock"));
    }

    @Test
    void testGuestToCustomerCartMerging() {
        String sessionId = "guest-session-" + UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        // 1. Add 3 items as guest
        cartService.addItemToCart(null, sessionId, testVariant.getId(), 3);

        // 2. Merge into authenticated user cart upon login
        CartResponse mergedCart = cartService.mergeGuestCart(sessionId, userId);

        assertEquals(userId, mergedCart.getUserId());
        assertEquals(1, mergedCart.getItems().size());
        assertEquals(3, mergedCart.getItems().get(0).getQuantity());
    }

    @Test
    void testCartPreCheckoutValidation() {
        String sessionId = "session-valid-" + UUID.randomUUID();

        cartService.addItemToCart(null, sessionId, testVariant.getId(), 2);
        CartValidationResponse validation = cartService.validateCartForCheckout(null, sessionId);

        assertTrue(validation.isValid());
        assertTrue(validation.getErrors().isEmpty());
    }

    @Test
    void testCartExpirationCleanup() {
        String sessionId = "session-expire-" + UUID.randomUUID();
        cartService.addItemToCart(null, sessionId, testVariant.getId(), 1);

        int cleanedCount = cartService.cleanupExpiredCarts(0);
        assertTrue(cleanedCount >= 1, "Should clean up expired active cart");
    }

    @Test
    void testVariantStockIsolationAndSumCount() {
        String sessionId = "session-variant-iso-" + UUID.randomUUID();

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateVariantRequest var150gReq = new CatalogDtos.CreateVariantRequest(
                "150g Pack", "SKU-150G-" + uniqueSuffix, new BigDecimal("150.00"),
                new BigDecimal("180.00"), 12, true
        );
        ProductVariant variant150g = adminCatalogService.addVariant(testProduct.getId(), var150gReq);

        CatalogDtos.CreateVariantRequest var250gReq = new CatalogDtos.CreateVariantRequest(
                "250g Pack", "SKU-250G-" + uniqueSuffix, new BigDecimal("250.00"),
                new BigDecimal("300.00"), 45, true
        );
        ProductVariant variant250g = adminCatalogService.addVariant(testProduct.getId(), var250gReq);

        // 1. Add 150g x 12
        CartResponse cart1 = cartService.addItemToCart(null, sessionId, variant150g.getId(), 12);
        assertEquals(12, cart1.getItemCount());

        // 2. Add 250g x 33 (150g x 12 must NOT bleed into 250g stock limit)
        CartResponse cart2 = cartService.addItemToCart(null, sessionId, variant250g.getId(), 33);
        assertEquals(45, cart2.getItemCount());
        assertEquals(2, cart2.getItems().size());

        // 3. Add 250g x 12 more up to max stock limit of 45 (total 250g = 45, total cart = 57)
        CartResponse cart3 = cartService.addItemToCart(null, sessionId, variant250g.getId(), 12);
        assertEquals(57, cart3.getItemCount());

        // 4. Attempt adding 250g x 1 more -> should fail with stock limit exception
        assertThrows(IllegalStateException.class, () ->
                cartService.addItemToCart(null, sessionId, variant250g.getId(), 1)
        );

        // 5. Remove 150g variant -> 250g x 45 remains unchanged, total count becomes 45
        CartResponse cart4 = cartService.removeItemFromCart(null, sessionId, variant150g.getId());
        assertEquals(45, cart4.getItemCount());
        assertEquals(1, cart4.getItems().size());
        assertEquals(variant250g.getId(), cart4.getItems().get(0).getVariantId());
    }
}
