package com.sporekart.support.domain;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TicketCategory {
    ORDER_ISSUE,
    PAYMENT_ISSUE,
    SHIPPING_ISSUE,
    TRAINING_ISSUE,
    PRODUCT_INQUIRY,
    GENERAL_SUPPORT;

    @JsonCreator
    public static TicketCategory fromString(String key) {
        if (key == null || key.trim().isEmpty()) {
            return GENERAL_SUPPORT;
        }
        String clean = key.trim().toUpperCase();
        switch (clean) {
            case "PAYMENT_FAILURE":
            case "PAYMENT_ISSUE":
            case "PAYMENT":
                return PAYMENT_ISSUE;
            case "SHIPMENT_DELAY":
            case "SHIPPING_ISSUE":
            case "SHIPPING":
            case "DELIVERY_ISSUE":
                return SHIPPING_ISSUE;
            case "COURSE_QUERY":
            case "TRAINING_ISSUE":
            case "TRAINING":
            case "WORKSHOP_QUERY":
                return TRAINING_ISSUE;
            case "GENERAL_INQUIRY":
            case "GENERAL_SUPPORT":
            case "GENERAL":
            case "INQUIRY":
            case "COMPLAINT":
                return GENERAL_SUPPORT;
            case "PRODUCT_INQUIRY":
            case "PRODUCT":
                return PRODUCT_INQUIRY;
            case "ORDER_ISSUE":
            case "ORDER":
                return ORDER_ISSUE;
            default:
                try {
                    return TicketCategory.valueOf(clean);
                } catch (IllegalArgumentException e) {
                    return GENERAL_SUPPORT;
                }
        }
    }
}
