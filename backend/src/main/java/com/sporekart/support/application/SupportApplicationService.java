package com.sporekart.support.application;

import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.notification.application.NotificationEventService;
import com.sporekart.notification.domain.NotificationEventType;
import com.sporekart.support.domain.*;
import com.sporekart.support.infrastructure.TicketMessageRepository;
import com.sporekart.support.infrastructure.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SupportApplicationService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationEventService notificationEventService;

    private static final Set<String> DOMAIN_KEYWORDS = Set.of(
            "order", "shipment", "shipping", "deliver", "delivery", "tracking", "courier",
            "spawn", "mushroom", "button", "oyster", "milky", "substrate", "cultivation", "growing",
            "payment", "pay", "refund", "wallet", "invoice", "gst", "bill", "transaction", "razorpay",
            "course", "training", "masterclass", "batch", "enroll", "enrollment", "study", "agronomy",
            "cancel", "cancellation", "address", "pincode", "return", "support", "help", "issue", "query", "status"
    );

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
                .isAutoReplied(true)
                .build();

        TicketMessage initialMsg = TicketMessage.builder()
                .ticket(ticket)
                .senderId(userId)
                .senderType(userId != null ? "CUSTOMER" : "GUEST")
                .senderName(senderName != null ? senderName : "Customer")
                .message(messageBody)
                .build();

        ticket.addMessage(initialMsg);

        // FAANG-Level Automated Intelligent Reply & Guardrail Check
        String autoReplyText = generateAutomatedResponse(ticket, subject + " " + messageBody);
        TicketMessage autoReplyMsg = TicketMessage.builder()
                .ticket(ticket)
                .senderId(null)
                .senderType("SYSTEM")
                .senderName("FAANG AI Helpdesk Assistant")
                .message(autoReplyText)
                .build();

        ticket.addMessage(autoReplyMsg);

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

        // Automatically update ticket status when customer closes ticket, or customer/support replies
        boolean isCloseMessage = messageText != null && (
                messageText.contains("[CUSTOMER TICKET RESOLUTION]") ||
                messageText.contains("[CUSTOMER RESOLUTION]") ||
                messageText.contains("marked ticket as CLOSED")
        );

        if (isCloseMessage) {
            ticket.setStatus(TicketStatus.CLOSED);
            ticket.setClosedBy("CUSTOMER");
            if (ticket.getClosedAt() == null) {
                ticket.setClosedAt(LocalDateTime.now());
            }
            if (messageText.contains("Rating: ")) {
                try {
                    int starIdx = messageText.indexOf("Rating: ") + 8;
                    char digit = messageText.charAt(starIdx);
                    int r = Character.getNumericValue(digit);
                    if (r >= 1 && r <= 5) {
                        ticket.setSatisfactionRating(r);
                    }
                } catch (Exception ignored) {}
            }
        } else if ("CUSTOMER".equalsIgnoreCase(senderType) && ticket.getStatus() == TicketStatus.WAITING_ON_CUSTOMER) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        } else if ("CUSTOMER".equalsIgnoreCase(senderType) && (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)) {
            ticket.setStatus(TicketStatus.IN_PROGRESS); // Re-open on customer message
        } else if (("SUPPORT_AGENT".equalsIgnoreCase(senderType) || "ADMIN".equalsIgnoreCase(senderType))
                && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TicketMessage savedMsg = messageRepository.save(message);

        // Guardrail & Relevance check on customer follow-up message
        if ("CUSTOMER".equalsIgnoreCase(senderType) && !isMessageDomainRelevant(messageText)) {
            TicketMessage guardrailMsg = TicketMessage.builder()
                    .ticket(ticket)
                    .senderId(null)
                    .senderType("SYSTEM")
                    .senderName("FAANG AI Helpdesk Assistant")
                    .message("🤖 [Helpdesk Guardrail Notice]: Your follow-up message appears off-topic or contains general text. For fastest assistance, please keep replies focused on Mushroom Spawn, Orders, Shipping, Payments, or Training Masterclasses. A human support agent will review your thread.")
                    .build();
            messageRepository.save(guardrailMsg);
            ticket.addMessage(guardrailMsg);
        }

        SupportTicket savedTicket = ticketRepository.save(ticket);
        if (isCloseMessage) {
            notifyTicketClosed(savedTicket, messageText);
        }
        return savedMsg;
    }

    @Transactional
    public SupportTicket closeTicketWithCsat(UUID ticketId, String closedBy, Integer rating, String feedback) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedBy(closedBy != null ? closedBy : "CUSTOMER");
        ticket.setClosedAt(LocalDateTime.now());

        if (rating != null) {
            if (rating < 1 || rating > 5) {
                throw new IllegalArgumentException("Satisfaction rating must be between 1 and 5 stars");
            }
            ticket.setSatisfactionRating(rating);
        }

        if (feedback != null && !feedback.trim().isEmpty()) {
            ticket.setSatisfactionFeedback(feedback.trim());
        }

        // Audit Message
        String ratingLabel = rating != null ? rating + "/5 Stars" : "Unrated";
        TicketMessage auditMsg = TicketMessage.builder()
                .ticket(ticket)
                .senderId(null)
                .senderType("SYSTEM")
                .senderName("System Notice")
                .message("Ticket ticket marked as CLOSED by " + ticket.getClosedBy() + ". Customer Satisfaction Score: " + ratingLabel + (feedback != null ? " (\"" + feedback.trim() + "\")" : ""))
                .build();

        ticket.addMessage(auditMsg);
        SupportTicket saved = ticketRepository.save(ticket);
        notifyTicketClosed(saved, feedback != null ? feedback : "Ticket closed with rating " + ratingLabel);
        return saved;
    }

    @Transactional
    public SupportTicket updateTicketStatus(UUID ticketId, TicketStatus status, TicketPriority priority) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        boolean wasClosed = ticket.getStatus() == TicketStatus.CLOSED;
        if (status != null) {
            ticket.setStatus(status);
            if (status == TicketStatus.CLOSED || status == TicketStatus.RESOLVED) {
                if (ticket.getClosedAt() == null) {
                    ticket.setClosedAt(LocalDateTime.now());
                    ticket.setClosedBy("SUPPORT_AGENT");
                }
            }
        }
        if (priority != null) {
            ticket.setPriority(priority);
        }

        SupportTicket saved = ticketRepository.save(ticket);
        if (!wasClosed && (status == TicketStatus.CLOSED || status == TicketStatus.RESOLVED)) {
            notifyTicketClosed(saved, "Ticket marked as " + status + " by Support Agent / Admin");
        }

        return saved;
    }

    private void notifyTicketClosed(SupportTicket ticket, String lastMessageNote) {
        if (ticket == null) return;
        try {
            User user = ticket.getUserId() != null ? userRepository.findById(ticket.getUserId()).orElse(null) : null;
            String recipientEmail = user != null && user.getEmail() != null ? user.getEmail() : null;
            String recipientName = user != null && user.getFullName() != null ? user.getFullName() : "Valued Customer";

            Map<String, Object> payload = new HashMap<>();
            payload.put("ticketNumber", ticket.getTicketNumber());
            payload.put("ticketId", ticket.getId().toString());
            payload.put("subject", ticket.getSubject());
            payload.put("category", ticket.getCategory() != null ? ticket.getCategory().name() : "GENERAL_SUPPORT");
            payload.put("priority", ticket.getPriority() != null ? ticket.getPriority().name() : "MEDIUM");
            payload.put("closedBy", ticket.getClosedBy() != null ? ticket.getClosedBy() : "SUPPORT_AGENT");
            payload.put("closedAt", ticket.getClosedAt() != null ? ticket.getClosedAt().toString() : LocalDateTime.now().toString());
            payload.put("satisfactionRating", ticket.getSatisfactionRating() != null ? ticket.getSatisfactionRating() : 0);
            payload.put("satisfactionFeedback", ticket.getSatisfactionFeedback() != null ? ticket.getSatisfactionFeedback() : "");
            payload.put("lastMessage", lastMessageNote != null ? lastMessageNote : ticket.getMessage());

            String deduplicationKey = "ticket-closed-" + ticket.getId() + "-" + (ticket.getClosedAt() != null ? ticket.getClosedAt() : System.currentTimeMillis());
            String emailSubject = "🎫 Support Ticket Resolved & Closed: #" + ticket.getTicketNumber() + " - " + ticket.getSubject();

            notificationEventService.recordEvent(
                    NotificationEventType.SUPPORT_TICKET_CLOSED,
                    "SUPPORT_TICKET",
                    ticket.getId(),
                    ticket.getUserId(),
                    recipientEmail,
                    recipientName,
                    emailSubject,
                    payload,
                    deduplicationKey
            );
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(SupportApplicationService.class)
                    .error("Failed to record ticket closure notification for ticket {}: {}", ticket.getTicketNumber(), e.getMessage(), e);
        }
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
    public org.springframework.data.domain.Page<SupportTicket> getAllTickets(org.springframework.data.domain.Pageable pageable) {
        return ticketRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public SupportTicket getTicketDetails(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCsatSummary() {
        Double avgRating = ticketRepository.findAverageSatisfactionRating();
        Long ratedCount = ticketRepository.countRatedTickets();
        Long totalTickets = ticketRepository.count();
        List<Object[]> breakdownRaw = ticketRepository.countTicketsBySatisfactionRating();

        Map<Integer, Long> ratingBreakdown = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingBreakdown.put(i, 0L);
        }
        if (breakdownRaw != null) {
            for (Object[] row : breakdownRaw) {
                if (row[0] instanceof Integer r && row[1] instanceof Long cnt) {
                    ratingBreakdown.put(r, cnt);
                }
            }
        }

        double doubleAvg = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 5.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("averageRating", doubleAvg);
        summary.put("ratedTicketsCount", ratedCount != null ? ratedCount : 0L);
        summary.put("totalTickets", totalTickets);
        summary.put("ratingBreakdown", ratingBreakdown);

        return summary;
    }

    private boolean isMessageDomainRelevant(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String lower = text.toLowerCase();
        for (String kw : DOMAIN_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        // If message has > 15 words, give benefit of doubt
        return text.trim().split("\\s+").length >= 8;
    }

    private String generateAutomatedResponse(SupportTicket ticket, String rawContent) {
        if (!isMessageDomainRelevant(rawContent)) {
            return "🤖 [FAANG AI Helpdesk Guardrail]: Thank you for contacting Sporekart Customer Care. Your ticket " + ticket.getTicketNumber() + " has been logged. Sporekart Helpdesk specializes in Mushroom Cultivation, Spawn Orders, Payments, Shipping, and Masterclasses. A human support specialist will review your request shortly.";
        }

        TicketCategory category = ticket.getCategory() != null ? ticket.getCategory() : TicketCategory.GENERAL_SUPPORT;

        return switch (category) {
            case ORDER_ISSUE, SHIPPING_ISSUE ->
                    "⚡ [FAANG AI Instant Assistant]: We have prioritized your inquiry regarding " + ticket.getTicketNumber() + ". Your order tracking is live-synced with Shiprocket Express. If your shipment is in transit, live location updates are visible in your customer portal. For cancellation or address changes, our support team will update your ticket shortly.";
            case TRAINING_ISSUE ->
                    "⚡ [FAANG AI Instant Assistant]: Welcome Trainee! Masterclass batch timings, Google Meet/Zoom links, and downloadable study guides are accessible under the 'Training Masterclasses' tab in your dashboard. Our agronomists will confirm any batch adjustment requests.";
            case PAYMENT_ISSUE ->
                    "⚡ [FAANG AI Instant Assistant]: Payment security notice: All transactions are processed through 256-bit SSL encrypted Razorpay payment gateway. For order or enrollment cancellations, 100% of refunded amounts are credited directly to your Sporekart Wallet or returned to source within 3-5 business days.";
            case PRODUCT_INQUIRY ->
                    "⚡ [FAANG AI Instant Assistant]: Thank you for inquiring about Sporekart Agro Products! For fresh mushrooms and spawn bags, store at 2°C–4°C refrigeration upon receipt. Our mycology technical specialists will provide tailored substrate and incubation advice on this thread.";
            default ->
                    "⚡ [FAANG AI Instant Assistant]: Thank you for reaching out to Sporekart Care! Ticket " + ticket.getTicketNumber() + " is active. An agronomist or customer specialist has been notified and will assist you shortly.";
        };
    }

    private String generateTicketNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomDigits = String.format("%04d", new Random().nextInt(10000));
        return "TKT-" + datePrefix + "-" + randomDigits;
    }
}
