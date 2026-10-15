package com.sporekart.order;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminOrderPaymentConfirmationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }

    private Order createTestOrder(String orderNumber, OrderStatus status, BigDecimal amount) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .status(status)
                .totalAmountInr(amount)
                .subtotalAmountInr(amount)
                .gstTotalAmountInr(BigDecimal.ZERO)
                .discountTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson("{\"recipientName\":\"Test Customer\",\"phone\":\"9876543210\",\"line1\":\"Farm Rd\",\"city\":\"Pune\",\"state\":\"MH\",\"pincode\":\"411001\"}")
                .build();
        return orderRepository.save(order);
    }

    @Test
    @DisplayName("ADM-ORD-01: Admin getAllOrders displays orders ONLY after payment confirmation (excluding PENDING_PAYMENT)")
    @Transactional
    void testAdminOrdersExcludePendingPaymentByDefault() {
        createTestOrder("ORD-UNPAID-1", OrderStatus.PENDING_PAYMENT, new BigDecimal("1200.00"));
        createTestOrder("ORD-PAID-2", OrderStatus.PAID, new BigDecimal("850.00"));
        createTestOrder("ORD-SHIPPED-3", OrderStatus.SHIPPED, new BigDecimal("1500.00"));

        Page<OrderResponse> adminOrders = orderService.getAllOrders(PageRequest.of(0, 25));

        assertNotNull(adminOrders);
        assertEquals(2, adminOrders.getTotalElements(), "Admin orders must only contain orders with confirmed payments");

        boolean containsUnpaid = adminOrders.getContent().stream()
                .anyMatch(o -> o.getStatus() == OrderStatus.PENDING_PAYMENT || "ORD-UNPAID-1".equals(o.getOrderNumber()));
        assertFalse(containsUnpaid, "Unpaid PENDING_PAYMENT orders must not be displayed in admin orders directory");

        boolean containsPaid = adminOrders.getContent().stream()
                .anyMatch(o -> "ORD-PAID-2".equals(o.getOrderNumber()));
        assertTrue(containsPaid, "Paid orders must be displayed in admin orders directory");
    }

    @Test
    @DisplayName("ADM-ORD-02: Admin explicit includeUnpaid parameter allows retrieving all orders when requested")
    @Transactional
    void testAdminOrdersExplicitIncludeUnpaid() {
        createTestOrder("ORD-UNPAID-1", OrderStatus.PENDING_PAYMENT, new BigDecimal("1200.00"));
        createTestOrder("ORD-PAID-2", OrderStatus.PAID, new BigDecimal("850.00"));

        Page<OrderResponse> allOrders = orderService.getAllOrders(PageRequest.of(0, 25), null, true);

        assertEquals(2, allOrders.getTotalElements(), "When includeUnpaid=true, all orders should be returned");
    }

    @Test
    @DisplayName("ADM-ORD-03: Revenue and active order counts include ONLY confirmed paid orders")
    @Transactional
    void testRevenueAndActiveOrdersOnlyCountConfirmedOrders() {
        createTestOrder("ORD-PENDING", OrderStatus.PENDING_PAYMENT, new BigDecimal("5000.00"));
        createTestOrder("ORD-PAID", OrderStatus.PAID, new BigDecimal("2000.00"));
        createTestOrder("ORD-SHIPPED", OrderStatus.SHIPPED, new BigDecimal("3000.00"));
        createTestOrder("ORD-CANCELLED", OrderStatus.CANCELLED, new BigDecimal("1000.00"));

        BigDecimal revenue = orderRepository.calculateTotalRevenueInr();
        Long activeCount = orderRepository.countActiveOrders();

        // Revenue must only include confirmed orders (PAID 2000 + SHIPPED 3000 = 5000), NOT pending (5000) or cancelled (1000)
        assertEquals(new BigDecimal("5000.00"), revenue, "Revenue must only sum confirmed paid orders");

        // Active orders must only count PAID and SHIPPED (2 orders), NOT PENDING_PAYMENT or CANCELLED
        assertEquals(2L, activeCount, "Active orders count must only include confirmed active orders");
    }

    @Test
    @DisplayName("ADM-ORD-04: Order transitions to PAID after payment verification and then displays in admin")
    @Transactional
    void testOrderBecomesVisibleInAdminAfterPaymentConfirmation() {
        Order pendingOrder = createTestOrder("ORD-CHECKOUT-101", OrderStatus.PENDING_PAYMENT, new BigDecimal("999.00"));

        // Before payment confirmation: not visible in admin
        Page<OrderResponse> beforeConfirmation = orderService.getAllOrders(PageRequest.of(0, 10));
        assertEquals(0, beforeConfirmation.getTotalElements(), "Order must not be in admin list before payment confirmation");

        // Payment confirmation occurs
        orderService.updateOrderStatus(pendingOrder.getId(), OrderStatus.PAID, "Payment captured via gateway", "PAYMENT_SERVICE");

        // After payment confirmation: now visible in admin
        Page<OrderResponse> afterConfirmation = orderService.getAllOrders(PageRequest.of(0, 10));
        assertEquals(1, afterConfirmation.getTotalElements(), "Order must be visible in admin after payment confirmation");
        assertEquals("ORD-CHECKOUT-101", afterConfirmation.getContent().get(0).getOrderNumber());
        assertEquals(OrderStatus.PAID, afterConfirmation.getContent().get(0).getStatus());
    }
}
