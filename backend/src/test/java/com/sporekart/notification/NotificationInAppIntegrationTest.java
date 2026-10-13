package com.sporekart.notification;

import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.domain.NotificationEvent;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.notification.infrastructure.NotificationEventRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NotificationInAppIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationEventRepository notificationRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testCustomer;
    private User otherCustomer;
    private User testAdmin;
    private String customerToken;
    private String otherCustomerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();

        testCustomer = userRepository.save(User.builder()
                .email("notif.customer." + UUID.randomUUID() + "@sporekart.in")
                .phone("+9191000" + (System.currentTimeMillis() % 100000))
                .fullName("Praveen Test Customer")
                .role(UserRole.ROLE_CUSTOMER)
                .isVerified(true)
                .build());

        otherCustomer = userRepository.save(User.builder()
                .email("other.customer." + UUID.randomUUID() + "@sporekart.in")
                .phone("+9192000" + (System.currentTimeMillis() % 100000))
                .fullName("Other Customer")
                .role(UserRole.ROLE_CUSTOMER)
                .isVerified(true)
                .build());

        testAdmin = userRepository.findByEmail("thepravara2026@gmail.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("thepravara2026@gmail.com")
                        .phone("+9193000" + (System.currentTimeMillis() % 100000))
                        .fullName("Sporekart Administrator")
                        .role(UserRole.ROLE_ADMIN)
                        .isVerified(true)
                        .build()));

        customerToken = jwtTokenProvider.generateToken(testCustomer.getId(), testCustomer.getEmail(), "ROLE_CUSTOMER");
        otherCustomerToken = jwtTokenProvider.generateToken(otherCustomer.getId(), otherCustomer.getEmail(), "ROLE_CUSTOMER");
        adminToken = jwtTokenProvider.generateToken(testAdmin.getId(), testAdmin.getEmail(), "ROLE_ADMIN");
    }

    @Test
    @DisplayName("NOTIF-01: Unread count returns accurate count for customer")
    void testGetUnreadCount() throws Exception {
        // Create 2 unread notifications for testCustomer
        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_CONFIRMED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Order #101 Confirmed")
                .templateKey("ORDER_CONFIRMED")
                .payloadJson("{}")
                .deduplicationKey("TEST_ORDER_101")
                .isRead(false)
                .build());

        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.WALLET_TOPUP_SUCCESS)
                .entityType("WALLET")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Wallet Topup Success")
                .templateKey("WALLET_TOPUP_SUCCESS")
                .payloadJson("{}")
                .deduplicationKey("TEST_WALLET_102")
                .isRead(false)
                .build());

        // 1 read notification
        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_DELIVERED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Order Delivered")
                .templateKey("ORDER_DELIVERED")
                .payloadJson("{}")
                .deduplicationKey("TEST_ORDER_DELIVERED")
                .isRead(true)
                .build());

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.unreadCount", is(2)));
    }

    @Test
    @DisplayName("NOTIF-02: Mark single notification as read updates status and readAt")
    void testMarkAsRead() throws Exception {
        NotificationEvent event = notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_CONFIRMED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Order #201 Confirmed")
                .templateKey("ORDER_CONFIRMED")
                .payloadJson("{}")
                .deduplicationKey("TEST_ORDER_201")
                .isRead(false)
                .build());

        mockMvc.perform(patch("/api/v1/notifications/" + event.getId() + "/read")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isRead", is(true)))
                .andExpect(jsonPath("$.data.readAt", notNullValue()));

        NotificationEvent updated = notificationRepository.findById(event.getId()).orElseThrow();
        assertTrue(updated.isRead());
    }

    @Test
    @DisplayName("NOTIF-03: Mark all notifications as read updates all unread rows")
    void testMarkAllAsRead() throws Exception {
        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_CONFIRMED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Order #301 Confirmed")
                .templateKey("ORDER_CONFIRMED")
                .payloadJson("{}")
                .deduplicationKey("TEST_ORDER_301")
                .isRead(false)
                .build());

        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_CONFIRMED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Order #302 Confirmed")
                .templateKey("ORDER_CONFIRMED")
                .payloadJson("{}")
                .deduplicationKey("TEST_ORDER_302")
                .isRead(false)
                .build());

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.markedCount", is(2)));

        // Verify unread count is now 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));
    }

    @Test
    @DisplayName("NOTIF-04: User isolation - User B cannot mark User A's notification as read")
    void testUserIsolation() throws Exception {
        NotificationEvent userAEvent = notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ORDER_CONFIRMED)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .userId(testCustomer.getId())
                .recipientEmail(testCustomer.getEmail())
                .subject("Private Order")
                .templateKey("ORDER_CONFIRMED")
                .payloadJson("{}")
                .deduplicationKey("PRIVATE_ORDER_1")
                .isRead(false)
                .build());

        // otherCustomer attempts to mark User A's notification as read
        mockMvc.perform(patch("/api/v1/notifications/" + userAEvent.getId() + "/read")
                        .header("Authorization", "Bearer " + otherCustomerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("NOTIF-05: Admin operational feed is protected by ROLE_ADMIN")
    void testAdminFeedSecurity() throws Exception {
        notificationRepository.save(NotificationEvent.builder()
                .eventType(NotificationEventType.ADMIN_NEW_ORDER)
                .entityType("ORDER")
                .entityId(UUID.randomUUID())
                .subject("Admin: High Value Order")
                .templateKey("ADMIN_NEW_ORDER")
                .payloadJson("{}")
                .deduplicationKey("ADMIN_ALERT_1")
                .isAdminNotification(true)
                .isRead(false)
                .build());

        // Customer attempt -> 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/notifications/in-app")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Admin attempt -> 200 OK
        mockMvc.perform(get("/api/v1/admin/notifications/in-app")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }
}
