package com.sporekart.order.application;

import com.sporekart.cart.application.CartService;
import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartItem;
import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.application.PricingService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.customer.api.CustomerDtos;
import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerAddress;
import com.sporekart.order.api.dto.*;
import com.sporekart.order.domain.*;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.shared.application.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventRepository orderEventRepository;
    private final CartService cartService;
    private final CatalogApplicationService catalogApplicationService;
    private final CustomerService customerService;
    private final InventoryService inventoryService;
    private final PricingService pricingService;
    private final com.sporekart.promotion.application.PromotionService promotionService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.identity.application.AuthService authService;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.notification.application.NotificationEventService notificationEventService;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.identity.infrastructure.UserRepository userRepository;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.shipping.application.ShippingService shippingService;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.payment.infrastructure.PaymentRepository paymentRepository;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.payment.application.PaymentService paymentService;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.payment.infrastructure.RefundRepository refundRepository;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.tracking-base-url:https://track.shiprocket.in/}")
    private String trackingBaseUrl = "https://track.shiprocket.in/";

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public OrderResponse createOrderFromCart(UUID userId, String sessionId, String idempotencyKey, CreateOrderRequest request) {
        // Admin restriction check
        if (userId != null) {
            userRepository.findById(userId).ifPresent(u -> {
                if ("thepravara2026@gmail.com".equalsIgnoreCase(u.getEmail()) || u.getRole() == com.sporekart.identity.domain.UserRole.ROLE_ADMIN) {
                    throw new IllegalStateException("The admin account (thepravara2026@gmail.com) is purely dedicated for administrative operations and cannot place customer orders.");
                }
            });
        }

        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {

            Optional<Order> existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }

        // 2. Fetch Cart
        Cart cart = cartService.getOrCreateCart(userId, sessionId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot create order from an empty cart");
        }

        // Publish CheckoutStartedEvent
        eventPublisher.publishEvent(com.sporekart.analytics.domain.events.CheckoutStartedEvent.builder()
                .cartId(cart.getId())
                .itemCount(cart.getItems().size())
                .userId(userId)
                .build());

        // 3. Resolve Address Snapshot
        OrderAddressSnapshot addressSnapshot = resolveAddressSnapshot(userId, request);

        if (userId != null) {
            if (addressSnapshot.getPhone() != null && !addressSnapshot.getPhone().isBlank()) {
                try {
                    authService.linkPhoneToUser(userId, addressSnapshot.getPhone());
                } catch (Exception e) {
                    log.info("Could not link shipping recipient phone to user profile (phone already in use or profile locked): {}", e.getMessage());
                }
            }
            if (request.getAddressId() == null && request.getShippingAddress() != null) {
                try {
                    List<CustomerDtos.AddressDto> existingAddrs = customerService.getAddresses(userId);
                    if (existingAddrs.isEmpty()) {
                        customerService.addAddress(userId, CustomerDtos.AddressRequest.builder()
                                .recipientName(addressSnapshot.getRecipientName())
                                .phone(addressSnapshot.getPhone())
                                .line1(addressSnapshot.getLine1())
                                .line2(addressSnapshot.getLine2())
                                .city(addressSnapshot.getCity())
                                .state(addressSnapshot.getState())
                                .pincode(addressSnapshot.getPincode())
                                .isDefault(true)
                                .build());
                    }
                } catch (Exception e) {
                    log.info("Could not auto-save initial customer address during checkout: {}", e.getMessage());
                }
            }
        }


        // 4. Generate Order Number
        String orderNumber = generateOrderNumber();

        // 5. Build Order Entity
        Order order = Order.builder()
                .userId(userId)
                .sessionId(sessionId)
                .orderNumber(orderNumber)
                .status(OrderStatus.PENDING_PAYMENT)
                .idempotencyKey(idempotencyKey)
                .shippingAddressJson(addressSnapshot.toJson())
                .shippingFeeInr(BigDecimal.ZERO) // Free shipping promotion
                .subtotalAmountInr(BigDecimal.ZERO)
                .gstTotalAmountInr(BigDecimal.ZERO)
                .discountTotalAmountInr(BigDecimal.ZERO)
                .totalAmountInr(BigDecimal.ZERO)
                .build();


        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal gstTotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;

        String createdBy = userId != null ? "USER:" + userId : "GUEST:" + sessionId;

        // 6. Process Line Items & Authoritative Calculations & Atomic Stock Reservation (sorted by variantId to avoid deadlocks)
        List<CartItem> sortedItems = cart.getItems().stream()
                .sorted(java.util.Comparator.comparing(CartItem::getVariantId))
                .toList();

        List<com.sporekart.promotion.application.PromotionService.CartItemContext> itemContexts = new ArrayList<>();

        for (CartItem item : sortedItems) {
            ProductVariant variant = catalogApplicationService.findVariantById(item.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + item.getVariantId()));
            Product product = variant.getProduct();

            if (product == null || !product.isActive() || product.getStatus() != com.sporekart.catalog.domain.ProductStatus.ACTIVE) {
                throw new IllegalStateException("Product '" + (product != null ? product.getTitle() : "Unknown") + "' is unavailable or unreleased");
            }

            if (!variant.isActive()) {
                throw new IllegalStateException("Variant '" + variant.getVariantName() + "' is inactive or discontinued");
            }

            // Reserve stock atomically via InventoryService
            inventoryService.reserveInventory(variant.getId(), item.getQuantity(), orderNumber, createdBy);

            // Authoritative Pricing & GST Calculation
            PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(product, variant);

            BigDecimal lineSubtotal = priceResult.getNetPriceInr().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineGst = priceResult.getGstAmountInr().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineDiscount = priceResult.getDiscountAmountInr().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineFinal = priceResult.getFinalPriceInr().multiply(BigDecimal.valueOf(item.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .variantId(variant.getId())
                    .productTitle(product.getTitle())
                    .variantName(variant.getVariantName())
                    .sku(variant.getSku())
                    .priceInr(priceResult.getFinalPriceInr())
                    .gstRatePercent(priceResult.getGstRatePercent())
                    .gstAmountInr(priceResult.getGstAmountInr())
                    .quantity(item.getQuantity())
                    .lineTotalInr(lineFinal)
                    .build();

            order.addItem(orderItem);

            subtotal = subtotal.add(lineSubtotal);
            gstTotal = gstTotal.add(lineGst);
            discountTotal = discountTotal.add(lineDiscount);

            itemContexts.add(com.sporekart.promotion.application.PromotionService.CartItemContext.builder()
                    .productId(product.getId())
                    .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                    .lineTotalInr(lineSubtotal)
                    .build());
        }

        BigDecimal shippingFee = BigDecimal.ZERO;
        BigDecimal promoDiscount = BigDecimal.ZERO;

        if (cart.getAppliedPromoCode() != null && !cart.getAppliedPromoCode().isBlank()) {
            var promoResult = promotionService.validateAndCalculate(
                    cart.getAppliedPromoCode(),
                    userId,
                    sessionId,
                    subtotal,
                    itemContexts
            );
            if (promoResult.isValid()) {
                promoDiscount = promoResult.getDiscountAmountInr() != null ? promoResult.getDiscountAmountInr() : BigDecimal.ZERO;
                if (promoResult.isFreeShipping()) {
                    shippingFee = BigDecimal.ZERO;
                }
            } else {
                String reason = promoResult.getMessage() != null ? promoResult.getMessage() : "Promo code is no longer eligible";
                throw new IllegalStateException("Applied promotion '" + cart.getAppliedPromoCode() + "' could not be applied: " + reason);
            }
        }

        discountTotal = discountTotal.add(promoDiscount);
        BigDecimal totalAmount = subtotal.add(gstTotal).add(shippingFee).subtract(promoDiscount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        order.setShippingFeeInr(shippingFee.setScale(2, RoundingMode.HALF_UP));
        order.setSubtotalAmountInr(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setGstTotalAmountInr(gstTotal.setScale(2, RoundingMode.HALF_UP));
        order.setDiscountTotalAmountInr(discountTotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmountInr(totalAmount.setScale(2, RoundingMode.HALF_UP));

        // 7. Add Initial Order Event
        OrderEvent initialEvent = OrderEvent.builder()
                .order(order)
                .previousState(null)
                .newState(OrderStatus.PENDING_PAYMENT)
                .reason("Order created successfully")
                .createdBy(createdBy)
                .build();
        order.addEvent(initialEvent);

        Order savedOrder = orderRepository.save(order);

        if (cart.getAppliedPromoCode() != null && !cart.getAppliedPromoCode().isBlank() && promoDiscount.compareTo(BigDecimal.ZERO) > 0) {
            final BigDecimal finalPromoDiscount = promoDiscount;
            promotionService.findByCode(cart.getAppliedPromoCode()).ifPresent(p -> {
                promotionService.recordUsage(p.getId(), userId, sessionId, savedOrder.getId(), finalPromoDiscount);
            });
        }

        // Publish OrderCreatedEvent
        eventPublisher.publishEvent(com.sporekart.analytics.domain.events.OrderCreatedEvent.builder()
                .orderId(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .totalAmountInr(savedOrder.getTotalAmountInr())
                .userId(userId)
                .build());

        // 8. Clear Cart after successful order creation
        cartService.clearCart(userId, sessionId);

        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return mapToResponse(order);
    }

    private boolean isCallerAdmin(UUID userId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
                if (auth.getAuthorities() != null) {
                    return auth.getAuthorities().stream()
                            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                }
                return false;
            }
        } catch (Exception ignored) {
            // Security context unavailable (e.g. non-web background job)
        }
        if (userId != null && userRepository != null) {
            try {
                return userRepository.findById(userId)
                        .map(u -> u.getRole() == com.sporekart.identity.domain.UserRole.ROLE_ADMIN)
                        .orElse(false);
            } catch (Exception ignored) {
                // Ignore if repository mock or query fails
            }
        }
        return false;
    }

    private void validateOrderAccess(Order order, UUID userId, String sessionId) {
        if (isCallerAdmin(userId)) {
            return;
        }

        if (order.getUserId() != null) {
            if (userId == null || !userId.equals(order.getUserId())) {
                throw new ForbiddenOperationException("Access denied: You are not authorized to access this order");
            }
        } else {
            if (sessionId == null || sessionId.trim().isEmpty() || !sessionId.equals(order.getSessionId())) {
                throw new ForbiddenOperationException("Access denied: You are not authorized to access this guest order");
            }
        }
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(UUID orderId, UUID userId, String sessionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        validateOrderAccess(order, userId, sessionId);

        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(UUID orderId, UUID userId) {
        return getOrderDetails(orderId, userId, null);
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(UUID orderId, UUID userId, String sessionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        validateOrderAccess(order, userId, sessionId);

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("GST tax invoice is available only after order is DELIVERED. Current status: " + order.getStatus());
        }

        return InvoicePdfGenerator.generateInvoicePdf(order);
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(UUID orderId, UUID userId) {
        return generateInvoicePdf(orderId, userId, null);
    }

    @Transactional
    public List<OrderResponse> getUserOrders(UUID userId, String sessionId) {
        List<Order> orders;
        if (userId != null) {
            // Claim unassigned guest orders from current session if present
            if (sessionId != null && !sessionId.trim().isEmpty()) {
                List<Order> unassignedSessionOrders = orderRepository.findBySessionIdAndUserIdIsNull(sessionId);
                if (!unassignedSessionOrders.isEmpty()) {
                    for (Order o : unassignedSessionOrders) {
                        o.setUserId(userId);
                    }
                    orderRepository.saveAll(unassignedSessionOrders);
                }
            }
            // STRICT USER ISOLATION: Fetch strictly orders created by or claimed by this specific authenticated user
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else if (sessionId != null && !sessionId.trim().isEmpty()) {
            // Guest mode: fetch only unassigned guest orders matching session ID
            orders = orderRepository.findBySessionIdAndUserIdIsNullOrderByCreatedAtDesc(sessionId);
        } else {
            return Collections.emptyList();
        }

        return orders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        return getUserOrders(userId, null);
    }

    @Transactional
    public void setRazorpayOrderId(UUID orderId, String razorpayOrderId) {
        orderRepository.findById(orderId).ifPresent(o -> {
            o.setRazorpayOrderId(razorpayOrderId);
            orderRepository.save(o);
        });
    }

    @Transactional
    public void setRazorpayPaymentId(UUID orderId, String razorpayPaymentId) {
        orderRepository.findById(orderId).ifPresent(o -> {
            o.setRazorpayPaymentId(razorpayPaymentId);
            orderRepository.save(o);
        });
    }

    @Transactional(readOnly = true)
    public Optional<OrderResponse> getOrderByRazorpayOrderId(String razorpayOrderId) {
        return orderRepository.findByRazorpayOrderId(razorpayOrderId)
                .map(this::mapToResponse);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public void confirmOrderInventory(UUID orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            for (OrderItem item : order.getItems()) {
                if (item.getVariantId() != null) {
                    inventoryService.confirmPurchase(item.getVariantId(), item.getQuantity(), order.getOrderNumber(), "PAYMENT_CONFIRMED");
                }
            }
        });
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, String reason, String updatedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return updateOrderStatusForEntity(order, newStatus, reason, updatedBy);
    }

    public OrderResponse updateOrderStatusForEntity(Order order, OrderStatus newStatus, String reason, String updatedBy) {
        OrderStatus previousStatus = order.getStatus();
        if (previousStatus == newStatus) {
            return mapToResponse(order);
        }

        // RULE 1: Delivered, Cancelled or Refunded orders are immutable terminal states and cannot be re-opened or modified
        if (previousStatus == OrderStatus.DELIVERED || previousStatus == OrderStatus.CANCELLED || previousStatus == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Order #" + order.getOrderNumber() + " is already " + previousStatus + " and cannot be modified or re-opened.");
        }

        // RULE 2: Once SHIPPED, direct arbitrary manual update to DELIVERED by Admin is restricted; status changes must be driven by courier updates/webhooks
        if (previousStatus == OrderStatus.SHIPPED && newStatus == OrderStatus.DELIVERED) {
            if (updatedBy != null && updatedBy.startsWith("ADMIN")) {
                throw new IllegalStateException("Order #" + order.getOrderNumber() + " is currently in transit with the courier partner. Delivery status updates must be driven by Courier Shipment tracking updates or carrier webhooks.");
            }
        }

        boolean isPaidOrder = (previousStatus == OrderStatus.PAID || previousStatus == OrderStatus.CONFIRMED || previousStatus == OrderStatus.PROCESSING);

        if (isPaidOrder && (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUND_PENDING || newStatus == OrderStatus.REFUNDED)) {
            newStatus = (newStatus == OrderStatus.REFUNDED) ? OrderStatus.REFUNDED : OrderStatus.REFUND_PENDING;
        }

        order.setStatus(newStatus);
        if (reason != null && !reason.trim().isEmpty()) {
            order.setCancellationReason(reason);
        } else if (newStatus == OrderStatus.REFUNDED) {
            order.setCancellationReason("Order refunded");
        } else if (newStatus == OrderStatus.REFUND_PENDING) {
            order.setCancellationReason("Order refund pending gateway confirmation");
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setCancellationReason("Order cancelled");
        }

        OrderEvent event = OrderEvent.builder()
                .order(order)
                .previousState(previousStatus)
                .newState(newStatus)
                .reason(reason != null ? reason : "Status updated to " + newStatus)
                .createdBy(updatedBy != null ? updatedBy : "SYSTEM")
                .build();
        order.addEvent(event);

        Order saved = orderRepository.save(order);
        if (newStatus == OrderStatus.DELIVERED) {
            if (eventPublisher != null) {
                eventPublisher.publishEvent(com.sporekart.analytics.domain.events.OrderDeliveredEvent.builder()
                        .orderId(saved.getId())
                        .orderNumber(saved.getOrderNumber())
                        .build());
            }
        } else if (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED || newStatus == OrderStatus.REFUND_PENDING) {
            final OrderStatus statusForNotification = newStatus;
            final String reasonForNotification = reason;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    String recipientEmail = null;
                    String recipientName = "Valued Customer";
                    if (saved.getUserId() != null && userRepository != null) {
                        var userOpt = userRepository.findById(saved.getUserId());
                        if (userOpt.isPresent()) {
                            recipientEmail = userOpt.get().getEmail();
                            recipientName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getFirstName();
                        }
                    }
                    OrderAddressSnapshot addrSnap = OrderAddressSnapshot.fromJson(saved.getShippingAddressJson());
                    if ((recipientEmail == null || recipientEmail.isBlank()) && addrSnap != null) {
                        recipientEmail = addrSnap.getEmail();
                        if (addrSnap.getRecipientName() != null) {
                            recipientName = addrSnap.getRecipientName();
                        }
                    }

                    if (notificationEventService != null) {
                        notificationEventService.recordEvent(
                                com.sporekart.notification.domain.NotificationEventType.ORDER_CANCELLED,
                                "ORDER",
                                saved.getId(),
                                saved.getUserId(),
                                recipientEmail,
                                recipientName,
                                "Sporekart Order Cancellation #" + saved.getOrderNumber(),
                                java.util.Map.of(
                                        "orderId", saved.getId().toString(),
                                        "orderNumber", saved.getOrderNumber(),
                                        "customerName", recipientName != null ? recipientName : "Grower",
                                        "reason", reasonForNotification != null ? reasonForNotification : "Cancelled",
                                        "refundAmount", saved.getTotalAmountInr() != null ? saved.getTotalAmountInr().toString() : "0.00"
                                ),
                                "ORDER_CANCELLED:" + saved.getId()
                        );

                        notificationEventService.recordAdminNotification(
                                com.sporekart.notification.domain.NotificationEventType.ADMIN_ORDER_CANCELLED,
                                "ORDER",
                                saved.getId(),
                                "Order #" + saved.getOrderNumber() + " Cancelled",
                                "Customer cancelled order #" + saved.getOrderNumber() + ". Reason: " + (reasonForNotification != null ? reasonForNotification : "Cancelled"),
                                "/admin?tab=orders&id=" + saved.getId(),
                                "ADMIN_ORDER_CANCELLED:" + saved.getId()
                        );

                        if (statusForNotification == OrderStatus.REFUND_PENDING) {
                            notificationEventService.recordEvent(
                                    com.sporekart.notification.domain.NotificationEventType.REFUND_INITIATED,
                                    "ORDER",
                                    saved.getId(),
                                    saved.getUserId(),
                                    recipientEmail,
                                    recipientName,
                                    "Refund Initiated: Order #" + saved.getOrderNumber() + " ⏳",
                                    java.util.Map.of(
                                            "orderId", saved.getId().toString(),
                                            "orderNumber", saved.getOrderNumber(),
                                            "refundAmount", saved.getTotalAmountInr() != null ? saved.getTotalAmountInr().toString() : "0.00",
                                            "actionUrl", "/dashboard?tab=orders&orderId=" + saved.getId()
                                    ),
                                    "REFUND_INITIATED:" + saved.getId()
                            );
                        }

                        if (statusForNotification == OrderStatus.REFUNDED) {
                            notificationEventService.recordEvent(
                                    com.sporekart.notification.domain.NotificationEventType.REFUND_COMPLETED,
                                    "ORDER",
                                    saved.getId(),
                                    saved.getUserId(),
                                    recipientEmail,
                                    recipientName,
                                    "Refund Processed: ₹" + (saved.getTotalAmountInr() != null ? saved.getTotalAmountInr() : "0.00") + " for Order #" + saved.getOrderNumber() + " 💸",
                                    java.util.Map.of(
                                            "orderId", saved.getId().toString(),
                                            "orderNumber", saved.getOrderNumber(),
                                            "refundAmount", saved.getTotalAmountInr() != null ? saved.getTotalAmountInr().toString() : "0.00",
                                            "actionUrl", "/dashboard?tab=orders&orderId=" + saved.getId()
                                    ),
                                    "REFUND_COMPLETED:" + saved.getId()
                            );
                        }
                    }
                } catch (Exception e) {
                    org.slf4j.LoggerFactory.getLogger(OrderService.class).error("Error recording ORDER_CANCELLED / REFUND notification: {}", e.getMessage());
                }
            });
        } else if (newStatus == OrderStatus.PROCESSING) {
            try {
                String recipientEmail = null;
                String recipientName = "Valued Customer";
                if (saved.getUserId() != null && userRepository != null) {
                    var userOpt = userRepository.findById(saved.getUserId());
                    if (userOpt.isPresent()) {
                        recipientEmail = userOpt.get().getEmail();
                        recipientName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getFirstName();
                    }
                }
                OrderAddressSnapshot addrSnap = OrderAddressSnapshot.fromJson(saved.getShippingAddressJson());
                if ((recipientEmail == null || recipientEmail.isBlank()) && addrSnap != null) {
                    recipientEmail = addrSnap.getEmail();
                    if (addrSnap.getRecipientName() != null) {
                        recipientName = addrSnap.getRecipientName();
                    }
                }

                if (notificationEventService != null) {
                    notificationEventService.recordEvent(
                            com.sporekart.notification.domain.NotificationEventType.ORDER_PACKED,
                            "ORDER",
                            saved.getId(),
                            saved.getUserId(),
                            recipientEmail,
                            recipientName,
                            "Your Sporekart Order #" + saved.getOrderNumber() + " Has Been Packed 📦",
                            java.util.Map.of(
                                    "orderId", saved.getId().toString(),
                                    "orderNumber", saved.getOrderNumber(),
                                    "customerName", recipientName != null ? recipientName : "Grower"
                            ),
                            "ORDER_PACKED:" + saved.getId()
                    );
                }
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(OrderService.class).error("Error recording ORDER_PACKED notification: {}", e.getMessage());
            }
        }
        return mapToResponse(saved);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public OrderResponse cancelOrder(UUID orderId, UUID userId, String sessionId, String reason) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        validateOrderAccess(order, userId, sessionId);
        boolean isAdmin = isCallerAdmin(userId);
        return performOrderCancellation(order, userId, reason, isAdmin);
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public OrderResponse cancelOrder(UUID orderId, UUID userId, String reason) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        boolean isAdmin = isCallerAdmin(userId);
        if (userId == null && order.getUserId() != null) {
            throw new ForbiddenOperationException("Access denied: User must be authenticated to cancel order");
        }
        if (order.getUserId() != null && !userId.equals(order.getUserId()) && !isAdmin) {
            throw new ForbiddenOperationException("Access denied: You are not authorized to cancel this order");
        }
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED || order.getStatus() == OrderStatus.REFUND_PENDING) {
            org.slf4j.LoggerFactory.getLogger(OrderService.class).info("Order {} is already in terminal/cancellation status {}. Returning existing state idempotently.", orderId, order.getStatus());
            return mapToResponse(order);
        }

        return performOrderCancellation(order, userId, reason, isAdmin);
    }

    private OrderResponse performOrderCancellation(Order order, UUID userId, String reason, boolean isAdmin) {
        UUID orderId = order.getId();

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == OrderStatus.CANCELLED || currentStatus == OrderStatus.REFUNDED || currentStatus == OrderStatus.REFUND_PENDING) {
            org.slf4j.LoggerFactory.getLogger(OrderService.class).info("Order {} is already in terminal/cancellation status {}. Returning existing state idempotently.", orderId, currentStatus);
            return mapToResponse(order);
        }
        if (currentStatus == OrderStatus.SHIPPED || currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Order cannot be cancelled once " + currentStatus);
        }

        boolean isPaidOrder = (currentStatus == OrderStatus.PAID || currentStatus == OrderStatus.CONFIRMED || currentStatus == OrderStatus.PROCESSING);

        // Check if an in-flight payment attempt succeeded for PENDING_PAYMENT orders
        if (!isPaidOrder && order.getRazorpayOrderId() != null && paymentRepository != null) {
            try {
                paymentRepository.findByRazorpayOrderId(order.getRazorpayOrderId()).ifPresent(p -> {
                    if (p.getStatus() == com.sporekart.payment.domain.PaymentStatus.CAPTURED) {
                        order.setStatus(OrderStatus.PAID);
                        if (order.getRazorpayPaymentId() == null && p.getRazorpayPaymentId() != null) {
                            order.setRazorpayPaymentId(p.getRazorpayPaymentId());
                        }
                    }
                });
                if (order.getStatus() == OrderStatus.PAID) {
                    isPaidOrder = true;
                }
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(OrderService.class).warn("Note: in-flight payment check failed: {}", ex.getMessage());
            }
        }

        String formattedReason = (reason != null && !reason.trim().isEmpty())
                ? reason
                : (isAdmin ? "Cancelled by Admin" : "Cancelled by Customer");

        // Release reserved stock back to available inventory
        for (OrderItem item : order.getItems()) {
            if (item.getVariantId() != null) {
                try {
                    inventoryService.releaseCancelledOrder(item.getVariantId(), item.getQuantity(), order.getOrderNumber(), isPaidOrder, formattedReason, isAdmin ? ("ADMIN:" + userId) : (userId != null ? userId.toString() : "CUSTOMER"));
                } catch (Exception ex) {
                    org.slf4j.LoggerFactory.getLogger(OrderService.class).warn("Failed to release inventory for variant {}: {}", item.getVariantId(), ex.getMessage());
                }
            }
        }

        // Cancel associated courier shipment if active (only relevant if order was beyond pending payment)
        if (currentStatus != OrderStatus.PENDING_PAYMENT) {
            try {
                shippingService.getShipmentByOrderId(orderId).ifPresent(s -> {
                    if (s.getStatus() != com.sporekart.shipping.domain.ShipmentStatus.CANCELLED) {
                        shippingService.cancelShipment(s.getId(), "Order cancelled prior to delivery");
                    }
                });
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(OrderService.class).warn("Note: Shipment cancel notification skipped: {}", e.getMessage());
            }
        }

        // Trigger tracked gateway/wallet refund if order was paid
        if (isPaidOrder && paymentService != null) {
            try {
                // If razorpayPaymentId is not yet on the order entity, attempt to resolve from paymentRepository
                if (order.getRazorpayPaymentId() == null && paymentRepository != null) {
                    paymentRepository.findByOrderId(orderId).stream()
                            .filter(p -> p.getStatus() == com.sporekart.payment.domain.PaymentStatus.CAPTURED)
                            .findFirst()
                            .ifPresent(p -> {
                                order.setRazorpayPaymentId(p.getRazorpayPaymentId());
                                orderRepository.save(order);
                            });
                }
                if (order.getRazorpayPaymentId() != null) {
                    paymentService.refundPayment(orderId, order.getTotalAmountInr(), formattedReason);
                    return getOrderById(orderId);
                } else {
                    org.slf4j.LoggerFactory.getLogger(OrderService.class).warn("Paid order {} has no payment ID recorded. Marking REFUND_PENDING for manual review.", orderId);
                    return updateOrderStatus(orderId, OrderStatus.REFUND_PENDING, "Refund pending manual review (missing payment ID): " + formattedReason, isAdmin ? "ADMIN:" + userId : (userId != null ? "CUSTOMER:" + userId : "GUEST"));
                }
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(OrderService.class).error("Gateway/wallet refund dispatch failed for order {}: {}", orderId, ex.getMessage());
                return updateOrderStatus(orderId, OrderStatus.REFUND_PENDING, "Refund pending gateway processing: " + formattedReason, isAdmin ? "ADMIN:" + userId : (userId != null ? "CUSTOMER:" + userId : "GUEST"));
            }
        }

        OrderStatus nextStatus = isPaidOrder ? OrderStatus.REFUND_PENDING : OrderStatus.CANCELLED;
        return updateOrderStatusForEntity(order, nextStatus, formattedReason, isAdmin ? "ADMIN:" + userId : (userId != null ? "CUSTOMER:" + userId : "GUEST"));
    }

    private OrderAddressSnapshot resolveAddressSnapshot(UUID userId, CreateOrderRequest request) {
        if (request.getAddressId() != null) {
            CustomerAddress a = customerService.findAddressById(request.getAddressId())
                    .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + request.getAddressId()));
            if (a.getUserId() != null && (userId == null || !userId.equals(a.getUserId()))) {
                throw new ForbiddenOperationException("Access denied: Address does not belong to the current user");
            }
            String deliveryContactPhone = (a.getAlternatePhone() != null && !a.getAlternatePhone().isBlank()) 
                    ? a.getAlternatePhone().trim() 
                    : a.getPhone();
            return OrderAddressSnapshot.builder()
                    .recipientName(a.getRecipientName())
                    .phone(deliveryContactPhone)
                    .line1(a.getLine1())
                    .line2(a.getLine2())
                    .city(a.getCity())
                    .state(a.getState())
                    .pincode(a.getPincode())
                    .build();
        }

        if (request.getShippingAddress() != null) {
            OrderAddressSnapshot snap = request.getShippingAddress();
            if (snap.getRecipientName() == null || snap.getRecipientName().trim().isEmpty() ||
                snap.getPhone() == null || snap.getPhone().trim().isEmpty() ||
                snap.getLine1() == null || snap.getLine1().trim().isEmpty() ||
                snap.getCity() == null || snap.getCity().trim().isEmpty() ||
                snap.getState() == null || snap.getState().trim().isEmpty() ||
                snap.getPincode() == null || !snap.getPincode().matches("^[1-9][0-9]{5}$")) {
                throw new IllegalArgumentException("Invalid shipping address details. Please check recipient name, phone, line1, city, state, and 6-digit PIN code.");
            }
            return snap;
        }

        throw new IllegalArgumentException("Shipping address is required for checkout");
    }

    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    public String generateOrderNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = "SK-" + datePrefix + "-" + String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        return "SK-" + datePrefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    @Transactional
    public void updateOrderShippingDetails(UUID orderId, String courierPartner, String trackingNumber, String trackingUrl) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setCourierPartner(courierPartner);
            order.setTrackingNumber(trackingNumber);
            order.setTrackingUrl(trackingUrl);
            if (order.getShippedAt() == null) {
                order.setShippedAt(java.time.OffsetDateTime.now());
            }
            orderRepository.save(order);
        });
    }

    public OrderResponse mapToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setUserId(order.getUserId());
        response.setSessionId(order.getSessionId());
        response.setOrderNumber(order.getOrderNumber());

        response.setSubtotalAmountInr(order.getSubtotalAmountInr());
        response.setGstTotalAmountInr(order.getGstTotalAmountInr());
        response.setDiscountTotalAmountInr(order.getDiscountTotalAmountInr());
        response.setShippingFeeInr(order.getShippingFeeInr());
        response.setTotalAmountInr(order.getTotalAmountInr());
        response.setStatus(order.getStatus());
        response.setIdempotencyKey(order.getIdempotencyKey());
        response.setCancellationReason(order.getCancellationReason());
        response.setRazorpayOrderId(order.getRazorpayOrderId());
        response.setRazorpayPaymentId(order.getRazorpayPaymentId());

        if (order.getCourierPartner() != null && !order.getCourierPartner().isBlank()) {
            response.setCourierPartner(order.getCourierPartner());
            response.setTrackingNumber(order.getTrackingNumber());
            response.setTrackingUrl(order.getTrackingUrl());
            response.setShippedAt(order.getShippedAt());
        } else if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            String defaultAwb = order.getId() != null ? "AWB-897" + order.getId().toString().substring(0, 6).toUpperCase() : "AWB-897000000";
            response.setCourierPartner("BlueDart Express");
            response.setTrackingNumber(defaultAwb);
            response.setTrackingUrl(buildTrackingUrl(defaultAwb));
            response.setShippedAt(order.getUpdatedAt());
        } else {
            response.setCourierPartner(null);
            response.setTrackingNumber(null);
            response.setTrackingUrl(null);
            response.setShippedAt(null);
        }

        response.setShippingAddress(OrderAddressSnapshot.fromJson(order.getShippingAddressJson()));
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        List<OrderItemResponse> itemResponses = order.getItems().stream().map(item -> {
            OrderItemResponse itemResp = new OrderItemResponse();
            itemResp.setId(item.getId());
            itemResp.setVariantId(item.getVariantId());
            itemResp.setProductTitle(item.getProductTitle());
            itemResp.setVariantName(item.getVariantName());
            itemResp.setSku(item.getSku());
            itemResp.setPriceInr(item.getPriceInr());
            itemResp.setGstRatePercent(item.getGstRatePercent());
            itemResp.setGstAmountInr(item.getGstAmountInr());
            itemResp.setQuantity(item.getQuantity());
            itemResp.setLineTotalInr(item.getLineTotalInr());
            return itemResp;
        }).collect(Collectors.toList());
        response.setItems(itemResponses);

        List<OrderEventResponse> eventResponses = order.getEvents().stream().map(event -> {
            OrderEventResponse eventResp = new OrderEventResponse();
            eventResp.setId(event.getId());
            eventResp.setPreviousState(event.getPreviousState());
            eventResp.setNewState(event.getNewState());
            eventResp.setReason(event.getReason());
            eventResp.setCreatedBy(event.getCreatedBy());
            eventResp.setCreatedAt(event.getCreatedAt());
            return eventResp;
        }).collect(Collectors.toList());
        response.setEvents(eventResponses);

        if (refundRepository != null && order.getId() != null) {
            try {
                List<com.sporekart.payment.domain.Refund> refundEntities = refundRepository.findByOrderId(order.getId());
                if (!refundEntities.isEmpty()) {
                    List<OrderResponse.RefundSummaryResponse> refundSummaries = refundEntities.stream()
                            .map(r -> new OrderResponse.RefundSummaryResponse(
                                    r.getId(),
                                    r.getRazorpayRefundId(),
                                    r.getAmountInr(),
                                    r.getCurrency(),
                                    r.getStatus() != null ? r.getStatus().name() : "PENDING",
                                    r.getReason(),
                                    r.getCreatedAt()
                            ))
                            .collect(Collectors.toList());
                    response.setRefunds(refundSummaries);

                    BigDecimal totalRefunded = refundEntities.stream()
                            .filter(r -> r.getStatus() == com.sporekart.payment.domain.RefundStatus.PROCESSED)
                            .map(com.sporekart.payment.domain.Refund::getAmountInr)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    response.setRefundedAmountInr(totalRefunded);

                    boolean hasProcessed = refundEntities.stream().anyMatch(r -> r.getStatus() == com.sporekart.payment.domain.RefundStatus.PROCESSED);
                    boolean hasPending = refundEntities.stream().anyMatch(r -> r.getStatus() == com.sporekart.payment.domain.RefundStatus.PENDING);
                    boolean hasFailed = refundEntities.stream().anyMatch(r -> r.getStatus() == com.sporekart.payment.domain.RefundStatus.FAILED);

                    if (order.getTotalAmountInr() != null && totalRefunded.compareTo(order.getTotalAmountInr()) >= 0 && totalRefunded.compareTo(BigDecimal.ZERO) > 0) {
                        response.setRefundStatus("PROCESSED");
                    } else if (hasProcessed && totalRefunded.compareTo(BigDecimal.ZERO) > 0) {
                        response.setRefundStatus("PARTIALLY_REFUNDED");
                    } else if (hasPending) {
                        response.setRefundStatus("PENDING");
                    } else if (hasFailed) {
                        response.setRefundStatus("FAILED");
                    }
                } else if (order.getStatus() == OrderStatus.REFUND_PENDING) {
                    response.setRefundStatus("PENDING");
                } else if (order.getStatus() == OrderStatus.REFUNDED) {
                    response.setRefundStatus("PROCESSED");
                    response.setRefundedAmountInr(order.getTotalAmountInr());
                }
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(OrderService.class).warn("Note: failed to load refund details for order {}: {}", order.getId(), ex.getMessage());
            }
        } else {
            if (order.getStatus() == OrderStatus.REFUND_PENDING) {
                response.setRefundStatus("PENDING");
            } else if (order.getStatus() == OrderStatus.REFUNDED) {
                response.setRefundStatus("PROCESSED");
                response.setRefundedAmountInr(order.getTotalAmountInr());
            }
        }

        return response;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(org.springframework.data.domain.Pageable pageable) {
        return getAllOrders(pageable, null, false);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(
            org.springframework.data.domain.Pageable pageable,
            OrderStatus statusFilter,
            boolean includeUnpaid
    ) {
        if (statusFilter != null) {
            return orderRepository.findByStatus(statusFilter, pageable).map(this::mapToResponse);
        }
        if (includeUnpaid) {
            return orderRepository.findAll(pageable).map(this::mapToResponse);
        }
        // Orders display only after payment confirmation (excluding PENDING_PAYMENT)
        return orderRepository.findByStatusNot(OrderStatus.PENDING_PAYMENT, pageable).map(this::mapToResponse);
    }

    private String buildTrackingUrl(String awbCode) {
        if (awbCode == null || awbCode.isBlank()) return "";
        String base = trackingBaseUrl != null ? trackingBaseUrl.trim() : "https://track.shiprocket.in/";
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + awbCode.trim();
    }
}
