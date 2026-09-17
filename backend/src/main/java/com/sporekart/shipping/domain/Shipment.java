package com.sporekart.shipping.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @Column(name = "shipment_id")
    private String providerShipmentId;

    @Column(name = "awb_code")
    private String awbCode;

    @Column(name = "courier_name")
    private String courierName;

    @Column(name = "courier_id")
    private String courierId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ShipmentStatus status;

    @Column(name = "pickup_scheduled_at")
    private ZonedDateTime pickupScheduledAt;

    @Column(name = "delivered_at")
    private ZonedDateTime deliveredAt;

    @Column(name = "shipping_address_json", columnDefinition = "TEXT")
    private String shippingAddressJson;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ShipmentTracking> trackingEvents = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = ShipmentStatus.CREATED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    public void addTrackingEvent(ShipmentTracking tracking) {
        trackingEvents.add(tracking);
        tracking.setShipment(this);
    }
}
