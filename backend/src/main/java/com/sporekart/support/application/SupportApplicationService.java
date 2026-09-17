package com.sporekart.support.application;

import com.sporekart.support.domain.SupportTicket;
import com.sporekart.support.infrastructure.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportApplicationService {

    private final SupportTicketRepository ticketRepository;

    public SupportTicket createTicket(UUID userId, String subject, String message) {
        SupportTicket ticket = SupportTicket.builder()
                .userId(userId)
                .subject(subject)
                .message(message)
                .status("OPEN")
                .build();
        return ticketRepository.save(ticket);
    }

    public List<SupportTicket> getUserTickets(UUID userId) {
        return ticketRepository.findByUserId(userId);
    }
}
