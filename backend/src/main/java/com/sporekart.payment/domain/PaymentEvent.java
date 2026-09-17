package com.sporekart.payment.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "event_id", unique = true)
    private String eventId;

    @Column(name = "event_data_json", columnDefinition = "TEXT")
    private String eventDataJson;

    @Column(name = "created_by", nullable = false)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
