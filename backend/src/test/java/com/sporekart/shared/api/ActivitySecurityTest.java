package com.sporekart.shared.api;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ActivitySecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("SEC-ACT-01: Recent activities endpoint anonymizes customer names, cities, and order numbers")
    void testRecentActivitiesAnonymization() throws Exception {
        // Create an order with real PII
        String realPiiAddress = "{\"recipientName\":\"Ramesh Tendulkar\",\"phone\":\"+919876543210\",\"addressLine1\":\"45 Cricket Lane\",\"city\":\"Mumbai\",\"state\":\"MH\",\"postalCode\":\"400001\"}";
        Order order = Order.builder()
                .orderNumber("ORD-PRIVATE-999")
                .userId(UUID.randomUUID())
                .status(OrderStatus.DELIVERED)
                .totalAmountInr(new BigDecimal("1200.00"))
                .subtotalAmountInr(new BigDecimal("1200.00"))
                .gstTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson(realPiiAddress)
                .build();
        orderRepository.save(order);

        mockMvc.perform(get("/activities/recent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                // Assert no individual PII is exposed
                .andExpect(jsonPath("$.data[*].actor", everyItem(nullValue())))
                .andExpect(jsonPath("$.data[*].city", everyItem(nullValue())))
                .andExpect(jsonPath("$.data[*].orderNumber", everyItem(nullValue())))
                // None of the items should leak "Ramesh Tendulkar" or "Mumbai" or "ORD-PRIVATE-999"
                .andExpect(content().string(not(containsString("Ramesh"))))
                .andExpect(content().string(not(containsString("Tendulkar"))))
                .andExpect(content().string(not(containsString("ORD-PRIVATE-999"))));
    }
}

