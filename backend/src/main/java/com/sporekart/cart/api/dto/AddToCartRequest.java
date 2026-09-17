package com.sporekart.cart.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AddToCartRequest {

    @NotNull(message = "Variant ID is required")
    private UUID variantId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    public AddToCartRequest() {}

    public AddToCartRequest(UUID variantId, Integer quantity) {
        this.variantId = variantId;
        this.quantity = quantity;
    }

    public UUID getVariantId() { return variantId; }
    public void setVariantId(UUID variantId) { this.variantId = variantId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
