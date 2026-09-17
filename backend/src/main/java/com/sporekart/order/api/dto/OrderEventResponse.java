package com.sporekart.order.api.dto;

import com.sporekart.order.domain.OrderStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public class OrderEventResponse {

    private UUID id;
    private OrderStatus previousState;
    private OrderStatus newState;
    private String reason;
    private String createdBy;
    private OffsetDateTime createdAt;

    public OrderEventResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public OrderStatus getPreviousState() { return previousState; }
    public void setPreviousState(OrderStatus previousState) { this.previousState = previousState; }

    public OrderStatus getNewState() { return newState; }
    public void setNewState(OrderStatus newState) { this.newState = newState; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
