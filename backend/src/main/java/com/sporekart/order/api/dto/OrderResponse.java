package com.sporekart.order.api.dto;

import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OrderResponse {

    private UUID id;
    private UUID userId;
    private String orderNumber;
    private BigDecimal subtotalAmountInr;
    private BigDecimal gstTotalAmountInr;
    private BigDecimal discountTotalAmountInr;
    private BigDecimal shippingFeeInr;
    private BigDecimal totalAmountInr;
    private OrderStatus status;
    private String idempotencyKey;
    private String cancellationReason;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private OrderAddressSnapshot shippingAddress;
    private List<OrderItemResponse> items = new ArrayList<>();
    private List<OrderEventResponse> events = new ArrayList<>();
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public OrderResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public BigDecimal getSubtotalAmountInr() { return subtotalAmountInr; }
    public void setSubtotalAmountInr(BigDecimal subtotalAmountInr) { this.subtotalAmountInr = subtotalAmountInr; }

    public BigDecimal getGstTotalAmountInr() { return gstTotalAmountInr; }
    public void setGstTotalAmountInr(BigDecimal gstTotalAmountInr) { this.gstTotalAmountInr = gstTotalAmountInr; }

    public BigDecimal getDiscountTotalAmountInr() { return discountTotalAmountInr; }
    public void setDiscountTotalAmountInr(BigDecimal discountTotalAmountInr) { this.discountTotalAmountInr = discountTotalAmountInr; }

    public BigDecimal getShippingFeeInr() { return shippingFeeInr; }
    public void setShippingFeeInr(BigDecimal shippingFeeInr) { this.shippingFeeInr = shippingFeeInr; }

    public BigDecimal getTotalAmountInr() { return totalAmountInr; }
    public void setTotalAmountInr(BigDecimal totalAmountInr) { this.totalAmountInr = totalAmountInr; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public OrderAddressSnapshot getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(OrderAddressSnapshot shippingAddress) { this.shippingAddress = shippingAddress; }

    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }

    public List<OrderEventResponse> getEvents() { return events; }
    public void setEvents(List<OrderEventResponse> events) { this.events = events; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
