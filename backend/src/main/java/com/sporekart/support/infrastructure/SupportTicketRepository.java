package com.sporekart.support.infrastructure;

import com.sporekart.support.domain.SupportTicket;
import com.sporekart.support.domain.TicketCategory;
import com.sporekart.support.domain.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<SupportTicket> findByTicketNumber(String ticketNumber);
    List<SupportTicket> findByStatus(TicketStatus status);
    List<SupportTicket> findByCategory(TicketCategory category);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(t.satisfactionRating) FROM SupportTicket t WHERE t.satisfactionRating IS NOT NULL")
    Double findAverageSatisfactionRating();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.satisfactionRating IS NOT NULL")
    Long countRatedTickets();

    @org.springframework.data.jpa.repository.Query("SELECT t.satisfactionRating, COUNT(t) FROM SupportTicket t WHERE t.satisfactionRating IS NOT NULL GROUP BY t.satisfactionRating")
    List<Object[]> countTicketsBySatisfactionRating();
}

