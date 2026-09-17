package com.sporekart.shipping.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "shipment_trackings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(name = "awb_code")
    private String awbCode;

    @Column(name = "current_status", nullable = false)
    private String currentStatus;

    @Column(name = "location")
    private String location;

    @Column(name = "activity", length = 500)
    private String activity;

    @Column(name = "timestamp")
    private ZonedDateTime timestamp;

    @Column(name = "event_data_json", columnDefinition = "TEXT")
    private String eventDataJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = ZonedDateTime.now();
        }
    }
}
