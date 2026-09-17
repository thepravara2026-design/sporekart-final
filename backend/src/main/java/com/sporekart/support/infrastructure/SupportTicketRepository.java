package com.sporekart.support.infrastructure;

import com.sporekart.support.domain.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByUserId(UUID userId);
}
