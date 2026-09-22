package com.sporekart.catalog.domain;

import lombok.Getter;

@Getter
public enum StockAvailability {
    AVAILABLE("Available"),
    LIMITED_STOCK("Limited stock"),
    LOW_STOCK("Only a few left. Hurry!"),
    OUT_OF_STOCK("Out of stock");

    private final String label;

    StockAvailability(String label) {
        this.label = label;
    }

    public static StockAvailability fromQuantity(int stockQuantity) {
        if (stockQuantity > 20) {
            return AVAILABLE;
        } else if (stockQuantity > 10) {
            return LIMITED_STOCK;
        } else if (stockQuantity > 0) {
            return LOW_STOCK;
        } else {
            return OUT_OF_STOCK;
        }
    }
}
