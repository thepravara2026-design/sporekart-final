package com.sporekart.cart.api;

import com.sporekart.cart.api.dto.*;
import com.sporekart.cart.application.CartService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        UUID userId = extractUserId(authentication);
        CartResponse cart = cartService.getCartResponse(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @Valid @RequestBody AddToCartRequest request) {
        UUID userId = extractUserId(authentication);
        CartResponse cart = cartService.addItemToCart(userId, sessionId, request.getVariantId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PutMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @PathVariable("variantId") UUID variantId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        UUID userId = extractUserId(authentication);
        CartResponse cart = cartService.updateItemQuantity(userId, sessionId, variantId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @PathVariable("variantId") UUID variantId) {
        UUID userId = extractUserId(authentication);
        CartResponse cart = cartService.removeItemFromCart(userId, sessionId, variantId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/merge")
    public ResponseEntity<ApiResponse<CartResponse>> mergeGuestCart(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("UNAUTHORIZED", "User must be logged in to merge cart"));
        }
        CartResponse cart = cartService.mergeGuestCart(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        UUID userId = extractUserId(authentication);
        CartResponse cart = cartService.clearCart(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CartValidationResponse>> validateCart(
            Authentication authentication,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        UUID userId = extractUserId(authentication);
        CartValidationResponse validation = cartService.validateCartForCheckout(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(validation));
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
