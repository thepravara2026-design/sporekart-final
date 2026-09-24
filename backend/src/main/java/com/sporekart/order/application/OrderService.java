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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.identity.application.AuthService authService;

    @Transactional
    public OrderResponse createOrderFromCart(UUID userId, String sessionId, String idempotencyKey, CreateOrderRequest request) {
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
                authService.linkPhoneToUser(userId, addressSnapshot.getPhone());
            }
            if (request.getAddressId() == null && request.getShippingAddress() != null) {
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

        for (CartItem item : sortedItems) {
            ProductVariant variant = catalogApplicationService.findVariantById(item.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + item.getVariantId()));
            Product product = variant.getProduct();

            if (product == null || !product.isActive()) {
                throw new IllegalStateException("Product '" + (product != null ? product.getTitle() : "Unknown") + "' is unavailable");
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
        }

        BigDecimal totalAmount = subtotal.add(gstTotal).add(order.getShippingFeeInr());

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

    private void validateOrderAccess(Order order, UUID userId, String sessionId) {
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

    @Transactional
    public void confirmOrderInventory(UUID orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            for (OrderItem item : order.getItems()) {
                if (item.getVariantId() != null) {
                    inventoryService.confirmPurchase(item.getVariantId(), item.getQuantity(), order.getOrderNumber(), "PAYMENT_CONFIRMED");
                }
            }
        });
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, String reason, String updatedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        if (previousStatus == newStatus) {
            return mapToResponse(order);
        }

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.CANCELLED) {
            order.setCancellationReason(reason);
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
            eventPublisher.publishEvent(com.sporekart.analytics.domain.events.OrderDeliveredEvent.builder()
                    .orderId(saved.getId())
                    .orderNumber(saved.getOrderNumber())
                    .build());
        }
        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID userId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (userId == null && order.getUserId() != null) {
            throw new ForbiddenOperationException("Access denied: User must be authenticated to cancel order");
        }
        if (order.getUserId() != null && !userId.equals(order.getUserId())) {
            throw new ForbiddenOperationException("Access denied: You are not authorized to cancel this order");
        }

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == OrderStatus.CANCELLED || currentStatus == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Order is already " + currentStatus);
        }
        if (currentStatus == OrderStatus.SHIPPED || currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Order cannot be cancelled once " + currentStatus);
        }

        OrderStatus nextStatus = (currentStatus == OrderStatus.PAID || currentStatus == OrderStatus.CONFIRMED)
                ? OrderStatus.REFUND_PENDING
                : OrderStatus.CANCELLED;

        // Release reserved stock back to available inventory
        for (OrderItem item : order.getItems()) {
            if (item.getVariantId() != null) {
                boolean fromSold = (currentStatus == OrderStatus.PAID || currentStatus == OrderStatus.CONFIRMED);
                inventoryService.releaseCancelledOrder(item.getVariantId(), item.getQuantity(), order.getOrderNumber(), fromSold, reason, userId != null ? userId.toString() : "CUSTOMER");
            }
        }

        return updateOrderStatus(orderId, nextStatus, reason, userId != null ? "CUSTOMER:" + userId : "GUEST");
    }

    private OrderAddressSnapshot resolveAddressSnapshot(UUID userId, CreateOrderRequest request) {
        if (request.getAddressId() != null) {
            CustomerAddress a = customerService.findAddressById(request.getAddressId())
                    .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + request.getAddressId()));
            if (userId != null && a.getUserId() != null && !userId.equals(a.getUserId())) {
                throw new ForbiddenOperationException("Access denied: Address does not belong to the current user");
            }
            return OrderAddressSnapshot.builder()
                    .recipientName(a.getRecipientName())
                    .phone(a.getPhone())
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

        return response;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(org.springframework.data.domain.Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::mapToResponse);
    }
}
