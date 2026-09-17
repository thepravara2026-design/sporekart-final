package com.sporekart.payment.domain;

public enum PaymentStatus {
    CREATED,
    INITIATED,
    AUTHORIZED,
    CAPTURED,
    FAILED,
    REFUNDED
}
