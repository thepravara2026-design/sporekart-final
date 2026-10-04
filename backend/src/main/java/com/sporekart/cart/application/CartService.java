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
    private final com.sporekart.promotion.application.PromotionService promotionService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Transactional
    public CartResponse getCartResponse(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        return buildCartResponse(cart);
    }

    @Transactional
    public Cart getOrCreateCart(UUID userId, String sessionId) {
        if (userId != null) {
            Optional<Cart> userCartOpt = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE);
            Cart userCart;
            if (userCartOpt.isPresent()) {
                userCart = userCartOpt.get();
            } else {
                userCart = cartRepository.save(new Cart(userId, null));
            }

            if (sessionId != null && !sessionId.trim().isEmpty()) {
                Optional<Cart> guestCartOpt = cartRepository.findBySessionIdAndStatus(sessionId, CartStatus.ACTIVE);
                if (guestCartOpt.isPresent()) {
                    Cart guestCart = guestCartOpt.get();
                    if (!guestCart.getId().equals(userCart.getId())) {
                        mergeGuestItemsIntoUserCart(guestCart, userCart);
                        guestCart.setStatus(CartStatus.CONVERTED);
                        guestCart.setSessionId(null);
                        cartRepository.save(guestCart);
                        return cartRepository.save(userCart);
                    }
                }
            }
            return userCart;
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

    private void mergeGuestItemsIntoUserCart(Cart guestCart, Cart userCart) {
        if (guestCart == null || guestCart.getItems() == null || guestCart.getItems().isEmpty()) {
            return;
        }
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
                    cartItemRepository.save(newItem);
                }
            }
        }
        if (userCart.getAppliedPromoCode() == null && guestCart.getAppliedPromoCode() != null) {
            userCart.setAppliedPromoCode(guestCart.getAppliedPromoCode());
        }
    }

    @Transactional
    public CartResponse mergeGuestCart(String sessionId, UUID userId) {
        if (userId == null) {
            return getCartResponse(null, sessionId);
        }
        Cart userCart = getOrCreateCart(userId, sessionId);
        return buildCartResponse(userCart);
    }

    @Transactional
    public CartResponse clearCart(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.clearItems();
        cart.setAppliedPromoCode(null);
        cartRepository.save(cart);
        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse applyPromotion(UUID userId, String sessionId, String code) {
        Cart cart = getOrCreateCart(userId, sessionId);
        if (code == null || code.trim().isEmpty()) {
            cart.setAppliedPromoCode(null);
            cartRepository.save(cart);
            return buildCartResponse(cart);
        }

        String cleanCode = code.trim().toUpperCase();

        // Calculate current cart totals and item context for validation
        CartResponse preview = buildCartResponse(cart);
        List<com.sporekart.promotion.application.PromotionService.CartItemContext> itemContexts = new ArrayList<>();
        if (preview.getItems() != null) {
            for (CartItemResponse item : preview.getItems()) {
                itemContexts.add(com.sporekart.promotion.application.PromotionService.CartItemContext.builder()
                        .productId(item.getProductId())
                        .categorySlug(null) // checked via product
                        .lineTotalInr(item.getLineTotalInr())
                        .build());
            }
        }

        var valResult = promotionService.validateAndCalculate(
                cleanCode,
                userId,
                sessionId,
                preview.getSubtotalInr(),
                itemContexts
        );

        if (!valResult.isValid()) {
            throw new IllegalArgumentException(valResult.getMessage());
        }

        cart.setAppliedPromoCode(cleanCode);
        cartRepository.save(cart);
        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse removePromotion(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.setAppliedPromoCode(null);
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
        List<com.sporekart.promotion.application.PromotionService.CartItemContext> itemContexts = new ArrayList<>();

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            response.setItems(itemResponses);
            response.setSubtotalInr(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            response.setGstTotalInr(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            response.setShippingFeeInr(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            response.setDiscountTotalInr(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            response.setEstimatedTotalInr(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            response.setItemCount(0);
            response.setValid(false);
            return response;
        }

        // Batch-load variants
        List<UUID> variantIds = cart.getItems().stream().map(CartItem::getVariantId).distinct().toList();
        Map<UUID, ProductVariant> variantMap = variantRepository.findAllById(variantIds).stream()
                .collect(java.util.stream.Collectors.toMap(ProductVariant::getId, v -> v));

        // Batch-load product media
        List<UUID> productIds = variantMap.values().stream()
                .map(v -> v.getProduct() != null ? v.getProduct().getId() : null)
                .filter(Objects::nonNull)
                .distinct().toList();

        Map<UUID, String> primaryImageMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            List<ProductMedia> mediaList = productMediaRepository.findByProductIdInOrderByDisplayOrderAsc(productIds);
            for (ProductMedia m : mediaList) {
                if (m.getProduct() != null) {
                    primaryImageMap.putIfAbsent(m.getProduct().getId(), m.getMediaUrl());
                }
            }
        }

        // Batch-load inventory records
        Map<UUID, Integer> stockMap = new HashMap<>();
        if (!variantIds.isEmpty()) {
            inventoryRecordRepository.findByVariantIdIn(variantIds)
                    .forEach(rec -> stockMap.put(rec.getVariantId(), rec.getAvailableQuantity()));
        }

        for (CartItem item : cart.getItems()) {
            CartItemResponse itemResp = new CartItemResponse();
            itemResp.setId(item.getId());
            itemResp.setVariantId(item.getVariantId());
            itemResp.setQuantity(item.getQuantity());

            ProductVariant variant = variantMap.get(item.getVariantId());
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

                int available = stockMap.getOrDefault(variant.getId(), variant.getStockQuantity());
                itemResp.setAvailableStock(available);
                itemResp.setInStock(available >= item.getQuantity());

                if (!itemResp.isInStock()) {
                    allValid = false;
                }

                BigDecimal lineSubtotal = priceResult.getNetPriceInr().multiply(BigDecimal.valueOf(item.getQuantity()));
                subtotal = subtotal.add(lineSubtotal);
                gstTotal = gstTotal.add(priceResult.getGstAmountInr().multiply(BigDecimal.valueOf(item.getQuantity())));

                itemContexts.add(com.sporekart.promotion.application.PromotionService.CartItemContext.builder()
                        .productId(product.getId())
                        .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                        .lineTotalInr(lineSubtotal)
                        .build());

                String imageUrl = primaryImageMap.get(product.getId());
                if (imageUrl != null) {
                    itemResp.setImageUrl(imageUrl);
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

        BigDecimal shippingFee = BigDecimal.ZERO;
        BigDecimal promoDiscount = BigDecimal.ZERO;
        boolean isFreeShippingPromo = false;
        String promoMsg = null;

        if (cart.getAppliedPromoCode() != null && !cart.getAppliedPromoCode().isBlank()) {
            var valResult = promotionService.validateAndCalculate(
                    cart.getAppliedPromoCode(),
                    cart.getUserId(),
                    cart.getSessionId(),
                    subtotal,
                    itemContexts
            );
            if (valResult.isValid()) {
                promoDiscount = valResult.getDiscountAmountInr() != null ? valResult.getDiscountAmountInr() : BigDecimal.ZERO;
                isFreeShippingPromo = valResult.isFreeShipping();
                if (isFreeShippingPromo) {
                    shippingFee = BigDecimal.ZERO;
                }
                promoMsg = valResult.getMessage();
                response.setAppliedPromoCode(cart.getAppliedPromoCode());
            } else {
                // Previously applied promo code is no longer eligible (e.g. subtotal dropped below minimum order value)
                cart.setAppliedPromoCode(null);
                cartRepository.save(cart);
                response.setAppliedPromoCode(null);
                promoMsg = valResult.getMessage();
            }
        }

        BigDecimal finalTotal = subtotal.add(gstTotal).add(shippingFee).subtract(promoDiscount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        response.setItems(itemResponses);
        response.setSubtotalInr(subtotal.setScale(2, RoundingMode.HALF_UP));
        response.setGstTotalInr(gstTotal.setScale(2, RoundingMode.HALF_UP));
        response.setShippingFeeInr(shippingFee.setScale(2, RoundingMode.HALF_UP));
        response.setDiscountTotalInr(promoDiscount.setScale(2, RoundingMode.HALF_UP));
        response.setPromoDiscountInr(promoDiscount.setScale(2, RoundingMode.HALF_UP));
        response.setFreeShipping(isFreeShippingPromo || shippingFee.compareTo(BigDecimal.ZERO) == 0);
        response.setPromoMessage(promoMsg);
        response.setEstimatedTotalInr(finalTotal.setScale(2, RoundingMode.HALF_UP));
        response.setItemCount(totalItemCount);
        response.setValid(allValid && !cart.getItems().isEmpty());

        return response;
    }
}

