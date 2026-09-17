package com.sporekart.order.domain;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUND_PENDING,
    REFUNDED
}
