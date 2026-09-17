package com.sporekart.cart.application;

import com.sporekart.cart.api.dto.*;
import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartItem;
import com.sporekart.cart.domain.CartStatus;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.application.PricingService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductMedia;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.catalog.infrastructure.ProductMediaRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductMediaRepository productMediaRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final PricingService pricingService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Transactional
    public CartResponse getCartResponse(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        return buildCartResponse(cart);
    }

    @Transactional
    public Cart getOrCreateCart(UUID userId, String sessionId) {
        if (userId != null) {
            Optional<Cart> userCart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE);
            if (userCart.isPresent()) {
                return userCart.get();
            }
            // Check if there is a guest cart with sessionId to claim
            if (sessionId != null && !sessionId.trim().isEmpty()) {
                Optional<Cart> sessionCart = cartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE);
                if (sessionCart.isPresent() && sessionCart.get().getUserId() == null) {
                    Cart cart = sessionCart.get();
                    cart.setUserId(userId);
                    return cartRepository.save(cart);
                }
            }
            return cartRepository.save(new Cart(userId, null));
        }

        if (sessionId != null && !sessionId.trim().isEmpty()) {
            return cartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE)
                    .orElseGet(() -> cartRepository.save(new Cart(null, sessionId)));
        }

        throw new IllegalArgumentException("Either userId or sessionId must be provided");
    }

    @Transactional
    public CartResponse addItemToCart(UUID userId, String sessionId, UUID variantId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Cart cart = getOrCreateCart(userId, sessionId);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + variantId));
        Product product = variant.getProduct();

        int availableStock = getAvailableStock(variantId, variant.getStockQuantity());
        
        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId);
        int currentInCart = existingItem.map(CartItem::getQuantity).orElse(0);
        int newQuantity = currentInCart + quantity;

        if (newQuantity > availableStock) {
            throw new IllegalStateException("Requested total quantity (" + newQuantity + ") exceeds available stock (" + availableStock + ")");
        }

        PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(product, variant);
        BigDecimal unitPrice = priceResult.getFinalPriceInr();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(newQuantity);
            item.setUnitPriceInr(unitPrice);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, variantId, quantity, unitPrice);
            cart.addItem(newItem);
            cartRepository.save(cart);
        }

        eventPublisher.publishEvent(com.sporekart.analytics.domain.events.AddToCartEvent.builder()
                .variantId(variantId)
                .quantity(quantity)
                .priceInr(unitPrice)
                .userId(userId)
                .sessionId(sessionId)
                .build());

        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse updateItemQuantity(UUID userId, String sessionId, UUID variantId, int quantity) {
        Cart cart = getOrCreateCart(userId, sessionId);
        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId);

        if (existingItem.isEmpty()) {
            throw new IllegalArgumentException("Item not found in cart");
        }

        CartItem item = existingItem.get();
        if (quantity <= 0) {
            cart.removeItem(item);
            cartItemRepository.delete(item);
            cartRepository.save(cart);
            return buildCartResponse(cart);
        }

        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + variantId));
        int availableStock = getAvailableStock(variantId, variant.getStockQuantity());

        if (quantity > availableStock) {
            throw new IllegalStateException("Requested quantity (" + quantity + ") exceeds available stock (" + availableStock + ")");
        }

        PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(variant.getProduct(), variant);
        item.setQuantity(quantity);
        item.setUnitPriceInr(priceResult.getFinalPriceInr());
        cartItemRepository.save(item);

        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse removeItemFromCart(UUID userId, String sessionId, UUID variantId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            cart.removeItem(item);
            cartItemRepository.delete(item);
            cartRepository.save(cart);
        }

        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse mergeGuestCart(String sessionId, UUID userId) {
        if (sessionId == null || sessionId.trim().isEmpty() || userId == null) {
            return getCartResponse(userId, sessionId);
        }

        Optional<Cart> guestCartOpt = cartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE);
        if (guestCartOpt.isEmpty()) {
            return getCartResponse(userId, sessionId);
        }

        Cart guestCart = guestCartOpt.get();
        if (userId.equals(guestCart.getUserId())) {
            return buildCartResponse(guestCart);
        }

        Cart userCart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> cartRepository.save(new Cart(userId, null)));

        for (CartItem guestItem : guestCart.getItems()) {
            Optional<CartItem> userItemOpt = cartItemRepository.findByCartIdAndVariantId(userCart.getId(), guestItem.getVariantId());
            ProductVariant variant = variantRepository.findById(guestItem.getVariantId()).orElse(null);
            if (variant == null) continue;

            int availableStock = getAvailableStock(variant.getId(), variant.getStockQuantity());
            if (userItemOpt.isPresent()) {
                CartItem userItem = userItemOpt.get();
                int mergedQty = Math.min(userItem.getQuantity() + guestItem.getQuantity(), availableStock);
                userItem.setQuantity(mergedQty);
                cartItemRepository.save(userItem);
            } else {
                int initQty = Math.min(guestItem.getQuantity(), availableStock);
                if (initQty > 0) {
                    CartItem newItem = new CartItem(userCart, guestItem.getVariantId(), initQty, guestItem.getUnitPriceInr());
                    userCart.addItem(newItem);
                }
            }
        }

        guestCart.setStatus(CartStatus.CONVERTED);
        cartRepository.save(guestCart);
        Cart savedUserCart = cartRepository.save(userCart);

        return buildCartResponse(savedUserCart);
    }

    @Transactional
    public CartResponse clearCart(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.clearItems();
        cartRepository.save(cart);
        return buildCartResponse(cart);
    }

    @Transactional(readOnly = true)
    public CartValidationResponse validateCartForCheckout(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        if (cart.getItems().isEmpty()) {
            errors.add("Your cart is empty");
            return new CartValidationResponse(false, warnings, errors);
        }

        for (CartItem item : cart.getItems()) {
            Optional<ProductVariant> variantOpt = variantRepository.findById(item.getVariantId());
            if (variantOpt.isEmpty()) {
                errors.add("Item in cart is no longer available");
                continue;
            }

            ProductVariant variant = variantOpt.get();
            Product product = variant.getProduct();
            if (product == null || !product.isActive()) {
                errors.add("Product '" + (product != null ? product.getTitle() : "Unknown") + "' is currently inactive");
                continue;
            }

            int availableStock = getAvailableStock(variant.getId(), variant.getStockQuantity());
            if (availableStock <= 0) {
                errors.add("Variant '" + variant.getVariantName() + "' of '" + product.getTitle() + "' is out of stock");
            } else if (item.getQuantity() > availableStock) {
                warnings.add("Requested quantity for '" + product.getTitle() + " (" + variant.getVariantName() + ")' exceeds available stock (" + availableStock + ")");
            }

            PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(product, variant);
            if (priceResult.getFinalPriceInr().compareTo(item.getUnitPriceInr()) != 0) {
                warnings.add("Price for '" + product.getTitle() + "' was updated to ₹" + priceResult.getFinalPriceInr());
            }
        }

        boolean valid = errors.isEmpty();
        return new CartValidationResponse(valid, warnings, errors);
    }

    @Transactional
    public int cleanupExpiredCarts(int expirationDays) {
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(expirationDays);
        List<Cart> expiredCarts = cartRepository.findByStatusAndUpdatedAtBefore(CartStatus.ACTIVE, cutoff);
        for (Cart cart : expiredCarts) {
            cart.setStatus(CartStatus.ABANDONED);
        }
        cartRepository.saveAll(expiredCarts);
        return expiredCarts.size();
    }

    private int getAvailableStock(UUID variantId, int fallbackStock) {
        return inventoryRecordRepository.findByVariantId(variantId)
                .map(rec -> rec.getAvailableQuantity())
                .orElse(fallbackStock);
    }

    public CartResponse buildCartResponse(Cart cart) {
        CartResponse response = new CartResponse();
        response.setId(cart.getId());
        response.setUserId(cart.getUserId());
        response.setSessionId(cart.getSessionId());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal gstTotal = BigDecimal.ZERO;
        int totalItemCount = 0;
        boolean allValid = true;

        List<CartItemResponse> itemResponses = new ArrayList<>();

        for (CartItem item : cart.getItems()) {
            CartItemResponse itemResp = new CartItemResponse();
            itemResp.setId(item.getId());
            itemResp.setVariantId(item.getVariantId());
            itemResp.setQuantity(item.getQuantity());

            ProductVariant variant = variantRepository.findById(item.getVariantId()).orElse(null);
            if (variant != null) {
                Product product = variant.getProduct();
                itemResp.setProductId(product.getId());
                itemResp.setProductTitle(product.getTitle());
                itemResp.setProductSlug(product.getSlug());
                itemResp.setVariantName(variant.getVariantName());
                itemResp.setSku(variant.getSku());

                PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(product, variant);
                BigDecimal unitPrice = priceResult.getFinalPriceInr();
                itemResp.setUnitPriceInr(unitPrice);

                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                itemResp.setLineTotalInr(lineTotal);

                int available = getAvailableStock(variant.getId(), variant.getStockQuantity());
                itemResp.setAvailableStock(available);
                itemResp.setInStock(available >= item.getQuantity());

                if (!itemResp.isInStock()) {
                    allValid = false;
                }

                subtotal = subtotal.add(priceResult.getNetPriceInr().multiply(BigDecimal.valueOf(item.getQuantity())));
                gstTotal = gstTotal.add(priceResult.getGstAmountInr().multiply(BigDecimal.valueOf(item.getQuantity())));

                // Find primary image URL
                List<ProductMedia> mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
                if (!mediaList.isEmpty()) {
                    itemResp.setImageUrl(mediaList.get(0).getMediaUrl());
                }

            } else {
                itemResp.setProductTitle("Unavailable Product");
                itemResp.setUnitPriceInr(item.getUnitPriceInr());
                itemResp.setLineTotalInr(item.getUnitPriceInr().multiply(BigDecimal.valueOf(item.getQuantity())));
                itemResp.setInStock(false);
                allValid = false;
            }

            totalItemCount += item.getQuantity();
            itemResponses.add(itemResp);
        }

        BigDecimal estimatedTotal = subtotal.add(gstTotal);

        response.setItems(itemResponses);
        response.setSubtotalInr(subtotal.setScale(2, RoundingMode.HALF_UP));
        response.setGstTotalInr(gstTotal.setScale(2, RoundingMode.HALF_UP));
        response.setEstimatedTotalInr(estimatedTotal.setScale(2, RoundingMode.HALF_UP));
        response.setItemCount(totalItemCount);
        response.setValid(allValid && !cart.getItems().isEmpty());

        return response;
    }
}
