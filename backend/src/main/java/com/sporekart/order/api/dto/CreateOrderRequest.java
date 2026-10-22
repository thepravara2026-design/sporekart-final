package com.sporekart.order.api.dto;

import com.sporekart.order.domain.OrderAddressSnapshot;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class CreateOrderRequest {

    private UUID addressId;

    @Valid
    private OrderAddressSnapshot shippingAddress;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public CreateOrderRequest() {}

    public CreateOrderRequest(UUID addressId, OrderAddressSnapshot shippingAddress, String notes) {
        this.addressId = addressId;
        this.shippingAddress = shippingAddress;
        this.notes = notes;
    }

    public UUID getAddressId() { return addressId; }
    public void setAddressId(UUID addressId) { this.addressId = addressId; }

    public OrderAddressSnapshot getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(OrderAddressSnapshot shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
