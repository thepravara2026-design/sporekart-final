package com.sporekart.shipping.domain;

public enum ShipmentStatus {
    CREATED,
    AWB_ASSIGNED,
    PICKUP_SCHEDULED,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    RETURNED
}
