package com.sporekart.catalog.domain;

public enum InventoryEventType {
    INITIALIZED,
    RESERVED,
    RELEASED,
    CONFIRMED_SOLD,
    CANCELLED_RESTOCKED,
    ADJUSTED
}
