package com.sporekart.order.application;

import com.sporekart.cart.application.CartService;
import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartItem;
import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.application.InventoryService;
import com.sporekart.catalog.application.PricingService;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductVariant;
import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerAddress;
import com.sporekart.order.api.dto.*;
import com.sporekart.order.domain.*;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
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

        // 3. Resolve Address Snapshot
        OrderAddressSnapshot addressSnapshot = resolveAddressSnapshot(userId, request);

        // 4. Generate Order Number
        String orderNumber = generateOrderNumber();

        // 5. Build Order Entity
        Order order = Order.builder()
                .userId(userId)
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

        // 6. Process Line Items & Authoritative Calculations & Atomic Stock Reservation
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = catalogApplicationService.findVariantById(item.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + item.getVariantId()));
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

        // 8. Clear Cart after successful order creation
        cartService.clearCart(userId, sessionId);

        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (userId != null && order.getUserId() != null && !userId.equals(order.getUserId())) {
            throw new IllegalArgumentException("Access denied to order details");
        }

        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        if (userId == null) return Collections.emptyList();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

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
        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID userId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (userId != null && order.getUserId() != null && !userId.equals(order.getUserId())) {
            throw new IllegalArgumentException("Access denied to cancel order");
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
            Optional<CustomerAddress> addrOpt = customerService.findAddressById(request.getAddressId());
            if (addrOpt.isPresent()) {
                CustomerAddress a = addrOpt.get();
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
        }

        if (request.getShippingAddress() != null) {
            return request.getShippingAddress();
        }

        throw new IllegalArgumentException("Shipping address is required for checkout");
    }

    private String generateOrderNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomDigits = String.format("%04d", new Random().nextInt(10000));
        return "SK-" + datePrefix + "-" + randomDigits;
    }

    public OrderResponse mapToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setUserId(order.getUserId());
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
}
