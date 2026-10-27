package com.sporekart.support.application;

import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.application.NotificationEventService;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.support.domain.*;
import com.sporekart.support.infrastructure.SupportTicketRepository;
import com.sporekart.support.infrastructure.TicketMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportServiceUnitTest {

    @Mock
    private SupportTicketRepository ticketRepository;
    @Mock
    private TicketMessageRepository messageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationEventService notificationEventService;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private SupportApplicationService supportService;

    private UUID userId;
    private UUID ticketId;
    private SupportTicket testTicket;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        ticketId = UUID.randomUUID();

        testTicket = SupportTicket.builder()
                .id(ticketId)
                .ticketNumber("TKT-20260926-1234")
                .userId(userId)
                .subject("Damaged shipment")
                .message("Item arrived damaged")
                .status(TicketStatus.OPEN)
                .priority(TicketPriority.HIGH)
                .category(TicketCategory.SHIPPING_ISSUE)
                .build();
    }

    @Test
    @DisplayName("SUP-1: Create ticket generates ticket number, initial message, and automated response")
    void SUP_1_createTicket_success() {
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArgument(0));

        SupportTicket ticket = supportService.createTicket(
                userId, "Late delivery", TicketCategory.SHIPPING_ISSUE, TicketPriority.HIGH,
                "Where is my package shipment order?", "John Doe", null, null, null, null, null
        );

        assertNotNull(ticket);
        assertTrue(ticket.getTicketNumber().startsWith("TKT-"));
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(2, ticket.getMessages().size()); // Initial user msg + system auto reply
        assertTrue(ticket.getIsAutoReplied());
        verify(ticketRepository).save(any(SupportTicket.class));
    }

    @Test
    @DisplayName("SUP-2: Add message to ticket automatically transitions status to IN_PROGRESS when customer replies")
    void SUP_2_addMessageToTicket_updatesStatus() {
        testTicket.setStatus(TicketStatus.WAITING_ON_CUSTOMER);
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
        when(messageRepository.save(any(TicketMessage.class))).thenAnswer(i -> i.getArgument(0));

        TicketMessage msg = supportService.addMessageToTicket(
                ticketId, userId, "CUSTOMER", "John Doe", "Here is the requested photo of the order package."
        );

        assertNotNull(msg);
        assertEquals(TicketStatus.IN_PROGRESS, testTicket.getStatus());
        verify(ticketRepository).save(testTicket);
    }

    @Test
    @DisplayName("SUP-3: Close ticket with CSAT rating and feedback sets CLOSED status and records CSAT")
    void SUP_3_closeTicketWithCsat_success() {
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArgument(0));

        SupportTicket closed = supportService.closeTicketWithCsat(ticketId, "CUSTOMER", 5, "Excellent resolution by helpdesk agent!");

        assertEquals(TicketStatus.CLOSED, closed.getStatus());
        assertEquals("CUSTOMER", closed.getClosedBy());
        assertEquals(5, closed.getSatisfactionRating());
        assertEquals("Excellent resolution by helpdesk agent!", closed.getSatisfactionFeedback());
        assertNotNull(closed.getClosedAt());
        verify(ticketRepository).save(testTicket);
    }

    @Test
    @DisplayName("SUP-4: Close ticket with invalid CSAT rating throws IllegalArgumentException")
    void SUP_4_closeTicketWithCsat_invalidRating() {
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                supportService.closeTicketWithCsat(ticketId, "CUSTOMER", 6, "Invalid score")
        );
        assertTrue(ex.getMessage().contains("Satisfaction rating must be between 1 and 5 stars"));
    }

    @Test
    @DisplayName("SUP-5: Get CSAT summary calculates average rating and rating breakdown")
    void SUP_5_getCsatSummary_success() {
        when(ticketRepository.findAverageSatisfactionRating()).thenReturn(4.8);
        when(ticketRepository.countRatedTickets()).thenReturn(10L);
        when(ticketRepository.count()).thenReturn(12L);
        when(ticketRepository.countTicketsBySatisfactionRating()).thenReturn(List.of(
                new Object[]{5, 8L},
                new Object[]{4, 2L}
        ));

        Map<String, Object> csatSummary = supportService.getCsatSummary();

        assertNotNull(csatSummary);
        assertEquals(4.8, csatSummary.get("averageRating"));
        assertEquals(10L, csatSummary.get("ratedTicketsCount"));
        assertEquals(12L, csatSummary.get("totalTickets"));
    }

    @Test
    @DisplayName("SUP-6: Create ticket with null or blank subject throws IllegalArgumentException")
    void SUP_6_createTicket_blankSubject_throwsException() {
        assertThrows(IllegalArgumentException.class, () ->
                supportService.createTicket(userId, "   ", TicketCategory.GENERAL_SUPPORT, TicketPriority.MEDIUM,
                        "Valid message body here", "John Doe", null, null, null, null, null)
        );
    }

    @Test
    @DisplayName("SUP-7: Create ticket with cross-customer orderId throws AccessDeniedException")
    void SUP_7_createTicket_crossCustomerOrder_throwsException() {
        UUID otherCustomerId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        com.sporekart.order.domain.Order otherOrder = com.sporekart.order.domain.Order.builder()
                .id(orderId)
                .userId(otherCustomerId)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(otherOrder));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () ->
                supportService.createTicket(userId, "Order inquiry", TicketCategory.ORDER_ISSUE, TicketPriority.MEDIUM,
                        "Where is this order?", "John Doe", orderId, null, null, null, null)
        );
    }

    @Test
    @DisplayName("SUP-8: Admin reply to ticket records SUPPORT_TICKET_REPLY notification event")
    void SUP_8_addMessageToTicket_adminReply_recordsNotification() {
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
        when(messageRepository.save(any(TicketMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArgument(0));

        TicketMessage msg = supportService.addMessageToTicket(
                ticketId, UUID.randomUUID(), "ADMIN", "Support Lead", "We have dispatched your spawn replacement."
        );

        assertNotNull(msg);
        verify(notificationEventService).recordEvent(
                eq(com.sporekart.notification.domain.NotificationEventType.SUPPORT_TICKET_REPLY),
                eq("SUPPORT_TICKET"),
                eq(ticketId),
                eq(userId),
                any(),
                any(),
                anyString(),
                anyMap(),
                anyString()
        );
    }
}
