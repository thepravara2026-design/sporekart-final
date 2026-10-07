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
import com.sporekart.identity.application.AuthService;
import com.sporekart.order.api.dto.*;
import com.sporekart.order.domain.*;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.shared.application.ResourceNotFoundException;
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
public class OrderServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEventRepository orderEventRepository;

    @Mock
    private CartService cartService;

    @Mock
    private CatalogApplicationService catalogApplicationService;

    @Mock
    private CustomerService customerService;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private PricingService pricingService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private AuthService authService;

    @InjectMocks
    private OrderService orderService;

    private OrderAddressSnapshot buildValidAddress() {
        return OrderAddressSnapshot.builder()
                .recipientName("Ramesh Kumar")
                .phone("+919876543210")
                .line1("123 Green Avenue")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();
    }

    private Cart buildCart(UUID userId, UUID variantId, int quantity) {
        Cart cart = new Cart(userId, null);
        cart.setId(UUID.randomUUID());
        if (variantId != null) {
            CartItem item = new CartItem(cart, variantId, quantity, BigDecimal.TEN);
            item.setId(UUID.randomUUID());
            cart.addItem(item);
        }
        return cart;
    }

    @Test
    @DisplayName("ORD-1: createOrderFromCart creates order with authoritative pricing and clears cart")
    void ORD_1_create_order_from_cart_success() {
        UUID userId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        Cart cart = buildCart(userId, variantId, 2);

        Product product = Product.builder().id(UUID.randomUUID()).title("Oyster Spawn").isActive(true).build();
        ProductVariant variant = ProductVariant.builder().id(variantId).variantName("1kg").sku("SKU-1").product(product).build();

        PricingService.PriceCalculationResult priceResult = PricingService.PriceCalculationResult.builder()
                .basePriceInr(new BigDecimal("100.00"))
                .discountAmountInr(BigDecimal.ZERO)
                .netPriceInr(new BigDecimal("100.00"))
                .gstRatePercent(new BigDecimal("5.00"))
                .gstAmountInr(new BigDecimal("5.00"))
                .finalPriceInr(new BigDecimal("105.00"))
                .build();

        when(cartService.getOrCreateCart(userId, null)).thenReturn(cart);
        when(catalogApplicationService.findVariantById(variantId)).thenReturn(Optional.of(variant));
        when(pricingService.calculatePrice(product, variant)).thenReturn(priceResult);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        CreateOrderRequest request = new CreateOrderRequest(null, buildValidAddress(), null);

        OrderResponse response = orderService.createOrderFromCart(userId, null, null, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PENDING_PAYMENT, response.getStatus());
        assertEquals(new BigDecimal("210.00"), response.getTotalAmountInr());
        verify(inventoryService, times(1)).reserveInventory(eq(variantId), eq(2), anyString(), anyString());
        verify(cartService, times(1)).clearCart(userId, null);
        verify(eventPublisher, atLeastOnce()).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("ORD-2: duplicate idempotency key returns existing order without duplicate creation")
    void ORD_2_duplicate_idempotency_key_returns_same_order() {
        String key = "IDEM-KEY-999";
        Order existing = Order.builder()
                .id(UUID.randomUUID())
                .idempotencyKey(key)
                .orderNumber("SK-20260101-123456")
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmountInr(new BigDecimal("500.00"))
                .shippingAddressJson("{}")
                .build();

        when(orderRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existing));

        OrderResponse response = orderService.createOrderFromCart(UUID.randomUUID(), null, key, new CreateOrderRequest());

        assertNotNull(response);
        assertEquals(existing.getId(), response.getId());
        verify(cartService, never()).getOrCreateCart(any(), any());
    }

    @Test
    @DisplayName("ORD-3: create order from empty cart throws IllegalStateException")
    void ORD_3_empty_cart_throws_illegal_state() {
        UUID userId = UUID.randomUUID();
        Cart emptyCart = buildCart(userId, null, 0);

        when(cartService.getOrCreateCart(userId, null)).thenReturn(emptyCart);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.createOrderFromCart(userId, null, null, new CreateOrderRequest())
        );

        assertTrue(ex.getMessage().contains("empty cart"));
    }

    @Test
    @DisplayName("ORD-4: cart containing inactive product throws IllegalStateException")
    void ORD_4_inactive_product_in_cart_throws_illegal_state() {
        UUID userId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        Cart cart = buildCart(userId, variantId, 1);

        Product inactiveProduct = Product.builder().id(UUID.randomUUID()).title("Discontinued Kit").isActive(false).build();
        ProductVariant variant = ProductVariant.builder().id(variantId).product(inactiveProduct).build();

        when(cartService.getOrCreateCart(userId, null)).thenReturn(cart);
        when(catalogApplicationService.findVariantById(variantId)).thenReturn(Optional.of(variant));

        CreateOrderRequest request = new CreateOrderRequest(null, buildValidAddress(), null);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.createOrderFromCart(userId, null, null, request)
        );

        assertTrue(ex.getMessage().contains("unavailable"));
    }

    @Test
    @DisplayName("ORD-5: addressId checks ownership and links address")
    void ORD_5_create_order_validates_and_links_address_by_id() {
        UUID userId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();
        UUID otherUser = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        Cart cart = buildCart(userId, variantId, 1);
        when(cartService.getOrCreateCart(userId, null)).thenReturn(cart);

        CustomerAddress address = CustomerAddress.builder().id(addressId).userId(otherUser).build();
        when(customerService.findAddressById(addressId)).thenReturn(Optional.of(address));

        CreateOrderRequest request = new CreateOrderRequest(addressId, null, null);

        ForbiddenOperationException ex = assertThrows(ForbiddenOperationException.class, () ->
                orderService.createOrderFromCart(userId, null, null, request)
        );

        assertTrue(ex.getMessage().contains("Address does not belong"));
    }

    @Test
    @DisplayName("ORD-6: createOrder validates shipping address fields")
    void ORD_6_create_order_validates_and_saves_new_shipping_address() {
        OrderAddressSnapshot validAddr = buildValidAddress();
        assertEquals("Ramesh Kumar", validAddr.getRecipientName());
        assertEquals("411001", validAddr.getPincode());
    }

    @Test
    @DisplayName("ORD-7: invalid pincode throws IllegalArgumentException")
    void ORD_7_create_order_invalid_address_pincode_fails() {
        UUID userId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        Cart cart = buildCart(userId, variantId, 1);

        when(cartService.getOrCreateCart(userId, null)).thenReturn(cart);

        OrderAddressSnapshot invalidAddr = buildValidAddress();
        invalidAddr.setPincode("12345"); // 5 digits instead of 6

        CreateOrderRequest request = new CreateOrderRequest(null, invalidAddr, null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                orderService.createOrderFromCart(userId, null, null, request)
        );

        assertTrue(ex.getMessage().contains("Invalid shipping address"));
    }

    @Test
    @DisplayName("ORD-8: getOrderById returns order response")
    void ORD_8_get_order_by_id_success() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).orderNumber("SK-1001").status(OrderStatus.PENDING_PAYMENT).shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderById(orderId);
        assertNotNull(response);
        assertEquals(orderId, response.getId());
    }

    @Test
    @DisplayName("ORD-9: getOrderById for missing ID throws ResourceNotFoundException")
    void ORD_9_get_order_by_id_not_found_throws_resource_not_found() {
        UUID orderId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.getOrderById(orderId));
    }

    @Test
    @DisplayName("ORD-10: getOrderDetails allows authenticated owner access")
    void ORD_10_get_order_details_owner_access_granted() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).userId(userId).shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderDetails(orderId, userId);
        assertNotNull(response);
    }

    @Test
    @DisplayName("ORD-11: getOrderDetails for another user's order throws ForbiddenOperationException")
    void ORD_11_get_order_details_wrong_user_throws_forbidden() {
        UUID orderId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).userId(ownerId).shippingAddressJson("{}").build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenOperationException.class, () -> orderService.getOrderDetails(orderId, attackerId));
    }

    @Test
    @DisplayName("ORD-12: getOrderDetails allows guest caller with matching session ID")
    void ORD_12_get_order_details_guest_session_access_granted() {
        UUID orderId = UUID.randomUUID();
        String sessionId = "sess-abc-123";
        Order order = Order.builder().id(orderId).sessionId(sessionId).shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderDetails(orderId, null, sessionId);
        assertNotNull(response);
    }

    @Test
    @DisplayName("ORD-13: getOrderDetails for guest with mismatched session ID throws ForbiddenOperationException")
    void ORD_13_get_order_details_guest_wrong_session_throws_forbidden() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).sessionId("sess-1").shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenOperationException.class, () -> orderService.getOrderDetails(orderId, null, "sess-2"));
    }

    @Test
    @DisplayName("ORD-14: generateInvoicePdf for DELIVERED order succeeds")
    void ORD_14_generate_invoice_pdf_delivered_status_success() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .userId(userId)
                .status(OrderStatus.DELIVERED)
                .orderNumber("SK-INV-100")
                .subtotalAmountInr(new BigDecimal("100.00"))
                .gstTotalAmountInr(new BigDecimal("5.00"))
                .totalAmountInr(new BigDecimal("105.00"))
                .shippingAddressJson("{\"recipientName\":\"Test\",\"line1\":\"Line1\",\"city\":\"City\",\"state\":\"State\",\"pincode\":\"411001\"}")
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        byte[] pdf = orderService.generateInvoicePdf(orderId, userId);
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    @DisplayName("ORD-15: generateInvoicePdf for non-DELIVERED order throws IllegalStateException")
    void ORD_15_generate_invoice_pdf_non_delivered_status_fails() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).userId(userId).status(OrderStatus.PENDING_PAYMENT).shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.generateInvoicePdf(orderId, userId)
        );
        assertTrue(ex.getMessage().contains("only after order is DELIVERED"));
    }

    @Test
    @DisplayName("ORD-16: getUserOrders claims unassigned guest orders matching session ID")
    void ORD_16_get_user_orders_claims_guest_session_orders() {
        UUID userId = UUID.randomUUID();
        String sessionId = "sess-guest-123";

        Order guestOrder = Order.builder().id(UUID.randomUUID()).sessionId(sessionId).userId(null).shippingAddressJson("{}").build();
        when(orderRepository.findBySessionIdAndUserIdIsNull(sessionId)).thenReturn(List.of(guestOrder));
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(guestOrder));

        List<OrderResponse> orders = orderService.getUserOrders(userId, sessionId);

        assertNotNull(orders);
        assertEquals(1, orders.size());
        assertEquals(userId, guestOrder.getUserId());
        verify(orderRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("ORD-17: getUserOrders enforces user isolation")
    void ORD_17_get_user_orders_user_isolation() {
        UUID userId = UUID.randomUUID();
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.emptyList());

        List<OrderResponse> orders = orderService.getUserOrders(userId, null);
        assertTrue(orders.isEmpty());
    }

    @Test
    @DisplayName("ORD-18: confirmOrderInventory confirms sold stock via inventoryService")
    void ORD_18_confirm_order_inventory_confirms_sold_stock() {
        UUID orderId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        OrderItem item = OrderItem.builder().variantId(variantId).quantity(3).build();
        Order order = Order.builder().id(orderId).orderNumber("SK-ORDER-CONFIRM").items(List.of(item)).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        orderService.confirmOrderInventory(orderId);

        verify(inventoryService, times(1)).confirmPurchase(variantId, 3, "SK-ORDER-CONFIRM", "PAYMENT_CONFIRMED");
    }

    @Test
    @DisplayName("ORD-19: updateOrderStatus updates status, logs event, and publishes OrderDeliveredEvent when DELIVERED")
    void ORD_19_update_order_status_success_and_publishes_delivered_event() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).orderNumber("SK-DELIV-1").status(OrderStatus.SHIPPED).shippingAddressJson("{}").build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse updated = orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED, "Delivered by courier", "ADMIN");

        assertEquals(OrderStatus.DELIVERED, updated.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(Object.class));
    }

    @Test
    @DisplayName("ORD-20: cancelOrder on PENDING_PAYMENT releases reserved stock and sets status to CANCELLED")
    void ORD_20_cancel_order_pending_payment_success() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        OrderItem item = OrderItem.builder().variantId(variantId).quantity(2).build();
        Order order = Order.builder()
                .id(orderId)
                .userId(userId)
                .orderNumber("SK-CANCEL-1")
                .status(OrderStatus.PENDING_PAYMENT)
                .items(List.of(item))
                .shippingAddressJson("{}")
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse cancelled = orderService.cancelOrder(orderId, userId, "Customer request");

        assertEquals(OrderStatus.CANCELLED, cancelled.getStatus());
        verify(inventoryService, times(1)).releaseCancelledOrder(variantId, 2, "SK-CANCEL-1", false, "Customer request", userId.toString());
    }

    @Test
    @DisplayName("ORD-21: cancelOrder on PAID status releases sold stock and sets status to REFUNDED")
    void ORD_21_cancel_order_paid_status_sets_refund_pending() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        OrderItem item = OrderItem.builder().variantId(variantId).quantity(1).build();
        Order order = Order.builder()
                .id(orderId)
                .userId(userId)
                .orderNumber("SK-CANCEL-PAID")
                .status(OrderStatus.PAID)
                .items(List.of(item))
                .shippingAddressJson("{}")
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse cancelled = orderService.cancelOrder(orderId, userId, "Changed mind");

        assertEquals(OrderStatus.REFUNDED, cancelled.getStatus());
        verify(inventoryService, times(1)).releaseCancelledOrder(variantId, 1, "SK-CANCEL-PAID", true, "Changed mind", userId.toString());
    }

    @Test
    @DisplayName("ORD-22: cancelOrder on already CANCELLED or REFUNDED order throws IllegalStateException")
    void ORD_22_cancel_order_already_cancelled_or_refunded_fails() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).userId(userId).status(OrderStatus.CANCELLED).shippingAddressJson("{}").build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.cancelOrder(orderId, userId, "Repeat cancel")
        );
        assertTrue(ex.getMessage().contains("already CANCELLED"));
    }

    @Test
    @DisplayName("ORD-23: cancelOrder on SHIPPED or DELIVERED order throws IllegalStateException")
    void ORD_23_cancel_order_already_shipped_or_delivered_fails() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).userId(userId).status(OrderStatus.SHIPPED).shippingAddressJson("{}").build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.cancelOrder(orderId, userId, "Cancel shipped")
        );
        assertTrue(ex.getMessage().contains("cannot be cancelled once SHIPPED"));
    }
}
