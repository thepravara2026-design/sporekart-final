package com.sporekart.order.api.dto;

import com.sporekart.order.domain.OrderAddressSnapshot;
import java.util.UUID;

public class CreateOrderRequest {

    private UUID addressId;
    private OrderAddressSnapshot shippingAddress;
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
