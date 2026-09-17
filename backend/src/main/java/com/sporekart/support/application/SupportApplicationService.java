package com.sporekart.support.application;

import com.sporekart.support.domain.*;
import com.sporekart.support.infrastructure.TicketMessageRepository;
import com.sporekart.support.infrastructure.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportApplicationService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;

    @Transactional
    public SupportTicket createTicket(
            UUID userId,
            String subject,
            TicketCategory category,
            TicketPriority priority,
            String messageBody,
            String senderName,
            UUID orderId,
            UUID paymentId,
            UUID shipmentId,
            UUID courseId,
            UUID productId
    ) {
        String ticketNumber = generateTicketNumber();

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(ticketNumber)
                .userId(userId)
                .subject(subject)
                .message(messageBody)
                .category(category != null ? category : TicketCategory.GENERAL_SUPPORT)
                .priority(priority != null ? priority : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .orderId(orderId)
                .paymentId(paymentId)
                .shipmentId(shipmentId)
                .courseId(courseId)
                .productId(productId)
                .build();

        TicketMessage initialMsg = TicketMessage.builder()
                .ticket(ticket)
                .senderId(userId)
                .senderType(userId != null ? "CUSTOMER" : "GUEST")
                .senderName(senderName != null ? senderName : "Customer")
                .message(messageBody)
                .build();

        ticket.addMessage(initialMsg);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketMessage addMessageToTicket(UUID ticketId, UUID senderId, String senderType, String senderName, String messageText) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        TicketMessage message = TicketMessage.builder()
                .ticket(ticket)
                .senderId(senderId)
                .senderType(senderType)
                .senderName(senderName)
                .message(messageText)
                .build();

        // Automatically update ticket status when customer replies or support replies
        if ("CUSTOMER".equalsIgnoreCase(senderType) && ticket.getStatus() == TicketStatus.WAITING_ON_CUSTOMER) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        } else if (("SUPPORT_AGENT".equalsIgnoreCase(senderType) || "ADMIN".equalsIgnoreCase(senderType))
                && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TicketMessage savedMsg = messageRepository.save(message);
        ticketRepository.save(ticket);
        return savedMsg;
    }

    @Transactional
    public SupportTicket updateTicketStatus(UUID ticketId, TicketStatus status, TicketPriority priority) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        if (status != null) {
            ticket.setStatus(status);
        }
        if (priority != null) {
            ticket.setPriority(priority);
        }

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> getUserTickets(UUID userId) {
        if (userId == null) return List.of();
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @Transactional(readOnly = true)
    public SupportTicket getTicketDetails(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));
    }

    private String generateTicketNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomDigits = String.format("%04d", new Random().nextInt(10000));
        return "TKT-" + datePrefix + "-" + randomDigits;
    }
}
