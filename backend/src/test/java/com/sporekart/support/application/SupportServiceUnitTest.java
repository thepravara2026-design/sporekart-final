package com.sporekart.support.application;

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
    @DisplayName("SUP-1: Create ticket generates ticket number and initial message")
    void SUP_1_createTicket_success() {
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArgument(0));

        SupportTicket ticket = supportService.createTicket(
                userId, "Late delivery", TicketCategory.SHIPPING_ISSUE, TicketPriority.HIGH,
                "Where is my package?", "John Doe", null, null, null, null, null
        );

        assertNotNull(ticket);
        assertTrue(ticket.getTicketNumber().startsWith("TKT-"));
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(1, ticket.getMessages().size());
        verify(ticketRepository).save(any(SupportTicket.class));
    }

    @Test
    @DisplayName("SUP-2: Add message to ticket automatically transitions status to IN_PROGRESS when customer replies")
    void SUP_2_addMessageToTicket_updatesStatus() {
        testTicket.setStatus(TicketStatus.WAITING_ON_CUSTOMER);
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
        when(messageRepository.save(any(TicketMessage.class))).thenAnswer(i -> i.getArgument(0));

        TicketMessage msg = supportService.addMessageToTicket(
                ticketId, userId, "CUSTOMER", "John Doe", "Here is the requested photo."
        );

        assertNotNull(msg);
        assertEquals(TicketStatus.IN_PROGRESS, testTicket.getStatus());
        verify(ticketRepository).save(testTicket);
    }

    @Test
    @DisplayName("SUP-3: Update ticket status updates status and priority")
    void SUP_3_updateTicketStatus() {
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArgument(0));

        SupportTicket updated = supportService.updateTicketStatus(ticketId, TicketStatus.RESOLVED, TicketPriority.LOW);

        assertEquals(TicketStatus.RESOLVED, updated.getStatus());
        assertEquals(TicketPriority.LOW, updated.getPriority());
    }

    @Test
    @DisplayName("SUP-4: Get user tickets returns tickets owned by user")
    void SUP_4_getUserTickets() {
        when(ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(testTicket));

        List<SupportTicket> tickets = supportService.getUserTickets(userId);

        assertEquals(1, tickets.size());
        assertEquals("Damaged shipment", tickets.get(0).getSubject());
    }

    @Test
    @DisplayName("SUP-5: Get ticket details throws exception when ticket not found")
    void SUP_5_getTicketDetails_notFound() {
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                supportService.getTicketDetails(ticketId)
        );
        assertTrue(ex.getMessage().contains("Support ticket not found"));
    }
}
