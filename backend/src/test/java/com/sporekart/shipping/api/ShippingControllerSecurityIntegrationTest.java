package com.sporekart.shipping.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import com.sporekart.order.api.dto.OrderResponse;

import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.shipping.application.ShippingApplicationService;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ShippingControllerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ShippingService shippingService;

    @MockBean
    private OrderService orderService;

    @org.springframework.beans.factory.annotation.Value("${sporekart.shiprocket.webhook-token}")
    private String configuredWebhookToken;

    @Test
    @DisplayName("SEC-01: Public pincode check succeeds without authentication")
    void testCheckPincode_public_success() throws Exception {
        mockMvc.perform(get("/shipping/check-pincode/411001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pincode").value("411001"))
                .andExpect(jsonPath("$.data.serviceable").value(true));
    }

    @Test
    @DisplayName("SEC-02: Webhook without valid signature/token returns 401 Unauthorized")
    void testWebhook_missingToken_unauthorized() throws Exception {
        ShippingDtos.ShiprocketWebhookPayload payload = new ShippingDtos.ShiprocketWebhookPayload(
                "AWB123456", "DELIVERED", "Pune Hub", "Delivered"
        );

        mockMvc.perform(post("/shipping/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-03: Webhook with valid token returns 200 OK")
    void testWebhook_validToken_success() throws Exception {
        ShippingDtos.ShiprocketWebhookPayload payload = new ShippingDtos.ShiprocketWebhookPayload(
                "AWB123456", "DELIVERED", "Pune Hub", "Delivered"
        );

        mockMvc.perform(post("/shipping/webhook")
                        .header("X-Shiprocket-Token", configuredWebhookToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("SEC-04: Non-admin user cannot create shipment (403 Forbidden)")
    void testCreateShipment_nonAdmin_forbidden() throws Exception {
        UUID customerId = UUID.randomUUID();
        String customerToken = tokenProvider.generateToken(customerId, "customer@example.com", "ROLE_CUSTOMER");

        ShippingDtos.CreateShipmentRequest request = new ShippingDtos.CreateShipmentRequest(UUID.randomUUID());

        mockMvc.perform(post("/shipping/create")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-05: Admin user can create shipment (200 OK)")
    void testCreateShipment_admin_success() throws Exception {
        UUID adminId = UUID.randomUUID();
        String adminToken = tokenProvider.generateToken(adminId, "admin@sporekart.in", "ROLE_ADMIN");

        UUID orderId = UUID.randomUUID();
        Shipment mockShipment = Shipment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .orderNumber("ORD-12345")
                .awbCode("AWB-TEST-999")
                .status(ShipmentStatus.PICKUP_SCHEDULED)
                .build();

        when(shippingService.createShipmentForOrder(eq(orderId))).thenReturn(mockShipment);

        ShippingDtos.CreateShipmentRequest request = new ShippingDtos.CreateShipmentRequest(orderId);

        mockMvc.perform(post("/shipping/create")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.awbCode").value("AWB-TEST-999"));
    }

    @Test
    @DisplayName("SEC-06: Unauthenticated user cannot view shipment by order (401 Unauthorized)")
    void testGetShipmentByOrder_unauthenticated_unauthorized() throws Exception {
        mockMvc.perform(get("/shipping/order/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-07: Customer cannot view another user's shipment details (403 Forbidden)")
    void testGetShipmentByOrder_differentUser_forbidden() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        String otherUserToken = tokenProvider.generateToken(otherUserId, "other@example.com", "ROLE_CUSTOMER");

        Shipment mockShipment = Shipment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .orderNumber("ORD-OWNER-01")
                .status(ShipmentStatus.IN_TRANSIT)
                .build();

        OrderResponse mockOrder = new OrderResponse();
        mockOrder.setId(orderId);
        mockOrder.setUserId(ownerId);

        when(shippingService.getShipmentByOrderId(orderId)).thenReturn(Optional.of(mockShipment));
        when(orderService.getOrderById(orderId)).thenReturn(mockOrder);

        mockMvc.perform(get("/shipping/order/" + orderId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-08: Order owner can view their own shipment details (200 OK)")
    void testGetShipmentByOrder_owner_success() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        String ownerToken = tokenProvider.generateToken(ownerId, "owner@example.com", "ROLE_CUSTOMER");

        Shipment mockShipment = Shipment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .orderNumber("ORD-OWNER-01")
                .awbCode("AWB-OWNER-123")
                .status(ShipmentStatus.IN_TRANSIT)
                .build();

        OrderResponse mockOrder = new OrderResponse();
        mockOrder.setId(orderId);
        mockOrder.setUserId(ownerId);

        when(shippingService.getShipmentByOrderId(orderId)).thenReturn(Optional.of(mockShipment));
        when(orderService.getOrderById(orderId)).thenReturn(mockOrder);

        mockMvc.perform(get("/shipping/order/" + orderId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.awbCode").value("AWB-OWNER-123"));
    }
}
