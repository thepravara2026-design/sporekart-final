package com.sporekart.order;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderAccessSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private com.sporekart.order.application.OrderService orderService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UUID userAId;
    private UUID userBId;
    private String tokenUserA;
    private String tokenUserB;

    private Order userAOrder;
    private Order guestOrder;
    private String guestSessionId = "session-12345";

    @BeforeEach
    void setUp() {
        userAId = UUID.randomUUID();
        userBId = UUID.randomUUID();

        tokenUserA = jwtTokenProvider.generateToken(userAId, "userA@sporekart.in", "ROLE_CUSTOMER");
        tokenUserB = jwtTokenProvider.generateToken(userBId, "userB@sporekart.in", "ROLE_CUSTOMER");

        userAOrder = Order.builder()
                .userId(userAId)
                .orderNumber("SK-TEST-USERA")
                .status(OrderStatus.PAID)
                .subtotalAmountInr(new BigDecimal("100.00"))
                .gstTotalAmountInr(new BigDecimal("18.00"))
                .shippingFeeInr(BigDecimal.ZERO)
                .discountTotalAmountInr(BigDecimal.ZERO)
                .totalAmountInr(new BigDecimal("118.00"))
                .shippingAddressJson("{\"recipientName\":\"User A\",\"phone\":\"9999999999\",\"line1\":\"Line 1\",\"city\":\"City\",\"state\":\"State\",\"pincode\":\"560001\"}")
                .build();
        userAOrder = orderRepository.save(userAOrder);

        guestOrder = Order.builder()
                .sessionId(guestSessionId)
                .orderNumber("SK-TEST-GUEST")
                .status(OrderStatus.PAID)
                .subtotalAmountInr(new BigDecimal("200.00"))
                .gstTotalAmountInr(new BigDecimal("36.00"))
                .shippingFeeInr(BigDecimal.ZERO)
                .discountTotalAmountInr(BigDecimal.ZERO)
                .totalAmountInr(new BigDecimal("236.00"))
                .shippingAddressJson("{\"recipientName\":\"Guest\",\"phone\":\"8888888888\",\"line1\":\"Line 1\",\"city\":\"City\",\"state\":\"State\",\"pincode\":\"560001\"}")
                .build();
        guestOrder = orderRepository.save(guestOrder);
    }

    @Test
    void testUserCanAccessOwnOrder() throws Exception {
        mockMvc.perform(get("/orders/" + userAOrder.getId())
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/orders/" + userAOrder.getId() + "/invoice")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());
    }

    @Test
    void testUserBCannotAccessUserAOrder() throws Exception {
        mockMvc.perform(get("/orders/" + userAOrder.getId())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/orders/" + userAOrder.getId() + "/invoice")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAnonymousWithoutSessionCannotAccessGuestOrder() throws Exception {
        mockMvc.perform(get("/orders/" + guestOrder.getId()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/orders/" + guestOrder.getId() + "/invoice"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/orders/" + guestOrder.getId())
                        .header("X-Session-ID", "wrong-session-id"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testOriginatingGuestSessionCanAccessGuestOrder() throws Exception {
        mockMvc.perform(get("/orders/" + guestOrder.getId())
                        .header("X-Session-ID", guestSessionId))
                .andExpect(status().isOk());

        mockMvc.perform(get("/orders/" + guestOrder.getId() + "/invoice")
                        .header("X-Session-ID", guestSessionId))
                .andExpect(status().isOk());
    }

    @Test
    void testCollisionSafeOrderNumberGeneration() {
        String existingNumber = userAOrder.getOrderNumber();
        org.junit.jupiter.api.Assertions.assertTrue(orderRepository.existsByOrderNumber(existingNumber));

        String newNumber = orderService.generateOrderNumber();
        org.junit.jupiter.api.Assertions.assertNotNull(newNumber);
        org.junit.jupiter.api.Assertions.assertNotEquals(existingNumber, newNumber, "Generated order number must not collide with existing order numbers");
        org.junit.jupiter.api.Assertions.assertFalse(orderRepository.existsByOrderNumber(newNumber));
    }
}
