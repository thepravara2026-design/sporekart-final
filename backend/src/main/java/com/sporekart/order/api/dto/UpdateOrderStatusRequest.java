package com.sporekart.order.api.dto;

import com.sporekart.order.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequest {

    @NotNull(message = "New order status is required")
    private OrderStatus newStatus;

    private String reason;

    public UpdateOrderStatusRequest() {}

    public UpdateOrderStatusRequest(OrderStatus newStatus, String reason) {
        this.newStatus = newStatus;
        this.reason = reason;
    }

    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
