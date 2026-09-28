package com.sporekart.cart.application;

import com.sporekart.cart.api.dto.CartResponse;
import com.sporekart.cart.api.dto.CartValidationResponse;
import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartItem;
import com.sporekart.cart.domain.CartStatus;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.application.PricingService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductMediaRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceUnitTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductVariantRepository variantRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductMediaRepository productMediaRepository;
    @Mock
    private InventoryRecordRepository inventoryRecordRepository;
    @Mock
    private PricingService pricingService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private CartService cartService;

    private UUID userId;
    private String sessionId;
    private Cart testCart;
    private Product testProduct;
    private ProductVariant testVariant;
    private UUID variantId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sessionId = "session-123";
        variantId = UUID.randomUUID();

        testCart = new Cart(userId, sessionId);

        testProduct = Product.builder()
                .id(UUID.randomUUID())
                .title("Oyster Mushroom")
                .slug("oyster-mushroom")
                .productType(ProductType.FRESH_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .gstRatePercent(new BigDecimal("5.00"))
                .isActive(true)
                .build();

        testVariant = ProductVariant.builder()
                .id(variantId)
                .product(testProduct)
                .variantName("200g Pack")
                .sku("SKU-OYSTER-200G")
                .compareAtPriceInr(new BigDecimal("120.00"))
                .priceInr(new BigDecimal("100.00"))
                .stockQuantity(10)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("CART-1: Create guest cart when only sessionId is provided")
    void CART_1_getOrCreateCart_guest_cart() {
        when(cartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));

        Cart cart = cartService.getOrCreateCart(null, sessionId);

        assertNotNull(cart);
        assertNull(cart.getUserId());
        assertEquals(sessionId, cart.getSessionId());
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("CART-2: Return active user cart when userId is provided")
    void CART_2_getOrCreateCart_user_cart() {
        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));

        Cart cart = cartService.getOrCreateCart(userId, sessionId);

        assertEquals(testCart, cart);
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    @DisplayName("CART-3: Add item to cart successfully when stock is available")
    void CART_3_addItemToCart_success() {
        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));
        when(inventoryRecordRepository.findByVariantId(variantId)).thenReturn(Optional.empty());
        when(cartItemRepository.findByCartIdAndVariantId(testCart.getId(), variantId))
                .thenReturn(Optional.empty());

        PricingService.PriceCalculationResult priceResult = PricingService.PriceCalculationResult.builder()
                .netPriceInr(new BigDecimal("100.00"))
                .gstAmountInr(new BigDecimal("5.00"))
                .finalPriceInr(new BigDecimal("105.00"))
                .build();
        when(pricingService.calculatePrice(testProduct, testVariant)).thenReturn(priceResult);

        CartResponse response = cartService.addItemToCart(userId, sessionId, variantId, 2);

        assertNotNull(response);
        verify(cartRepository).save(testCart);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("CART-4: Throw exception when adding item with quantity <= 0")
    void CART_4_addItemToCart_invalid_quantity() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> cartService.addItemToCart(userId, sessionId, variantId, 0)
        );
        assertEquals("Quantity must be greater than zero", exception.getMessage());
    }

    @Test
    @DisplayName("CART-5: Throw exception when adding item exceeds available stock")
    void CART_5_addItemToCart_exceeds_stock() {
        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));
        when(inventoryRecordRepository.findByVariantId(variantId)).thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> cartService.addItemToCart(userId, sessionId, variantId, 15)
        );
        assertTrue(exception.getMessage().contains("exceeds available stock"));
    }

    @Test
    @DisplayName("CART-6: Update item quantity in cart")
    void CART_6_updateItemQuantity_success() {
        CartItem cartItem = new CartItem(testCart, variantId, 2, new BigDecimal("105.00"));
        testCart.addItem(cartItem);

        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndVariantId(testCart.getId(), variantId))
                .thenReturn(Optional.of(cartItem));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));

        PricingService.PriceCalculationResult priceResult = PricingService.PriceCalculationResult.builder()
                .netPriceInr(new BigDecimal("100.00"))
                .gstAmountInr(new BigDecimal("5.00"))
                .finalPriceInr(new BigDecimal("105.00"))
                .build();
        when(pricingService.calculatePrice(testProduct, testVariant)).thenReturn(priceResult);

        CartResponse response = cartService.updateItemQuantity(userId, sessionId, variantId, 5);

        assertNotNull(response);
        assertEquals(5, cartItem.getQuantity());
        verify(cartItemRepository).save(cartItem);
    }

    @Test
    @DisplayName("CART-7: Update item quantity to 0 removes the item")
    void CART_7_updateItemQuantity_zero_removes_item() {
        CartItem cartItem = new CartItem(testCart, variantId, 2, new BigDecimal("105.00"));
        testCart.addItem(cartItem);

        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndVariantId(testCart.getId(), variantId))
                .thenReturn(Optional.of(cartItem));

        CartResponse response = cartService.updateItemQuantity(userId, sessionId, variantId, 0);

        assertNotNull(response);
        verify(cartItemRepository).delete(cartItem);
        verify(cartRepository).save(testCart);
    }

    @Test
    @DisplayName("CART-8: Remove item from cart")
    void CART_8_removeItemFromCart_success() {
        CartItem cartItem = new CartItem(testCart, variantId, 2, new BigDecimal("105.00"));
        testCart.addItem(cartItem);

        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndVariantId(testCart.getId(), variantId))
                .thenReturn(Optional.of(cartItem));

        CartResponse response = cartService.removeItemFromCart(userId, sessionId, variantId);

        assertNotNull(response);
        verify(cartItemRepository).delete(cartItem);
    }

    @Test
    @DisplayName("CART-9: Merge guest cart items into authenticated user cart")
    void CART_9_mergeGuestCart_success() {
        String guestSession = "guest-123";
        Cart guestCart = new Cart(null, guestSession);
        CartItem guestItem = new CartItem(guestCart, variantId, 3, new BigDecimal("105.00"));
        guestCart.addItem(guestItem);

        when(cartRepository.findBySessionIdAndStatus(guestSession, CartStatus.ACTIVE))
                .thenReturn(Optional.of(guestCart));
        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));

        CartResponse response = cartService.mergeGuestCart(guestSession, userId);

        assertNotNull(response);
        assertEquals(CartStatus.CONVERTED, guestCart.getStatus());
        verify(cartRepository).save(guestCart);
        verify(cartRepository).save(testCart);
    }

    @Test
    @DisplayName("CART-10: Validate cart for checkout - empty cart error")
    void CART_10_validateCartForCheckout_empty_cart() {
        when(cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE))
                .thenReturn(Optional.of(testCart));

        CartValidationResponse validation = cartService.validateCartForCheckout(userId, sessionId);

        assertFalse(validation.isValid());
        assertTrue(validation.getErrors().contains("Your cart is empty"));
    }
}
