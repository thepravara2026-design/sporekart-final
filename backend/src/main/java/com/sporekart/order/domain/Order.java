package com.sporekart.order.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Column(name = "subtotal_amount_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal subtotalAmountInr = BigDecimal.ZERO;

    @Column(name = "gst_total_amount_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal gstTotalAmountInr = BigDecimal.ZERO;

    @Column(name = "discount_total_amount_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountTotalAmountInr = BigDecimal.ZERO;

    @Column(name = "shipping_fee_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingFeeInr = BigDecimal.ZERO;

    @Column(name = "total_amount_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmountInr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "shipping_address_json", columnDefinition = "TEXT", nullable = false)
    private String shippingAddressJson;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderEvent> events = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void addEvent(OrderEvent event) {
        events.add(event);
        event.setOrder(this);
    }
}
