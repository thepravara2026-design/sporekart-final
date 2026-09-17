package com.sporekart.order.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "product_title", nullable = false)
    private String productTitle;

    @Column(name = "variant_name", nullable = false)
    private String variantName;

    private String sku;

    @Column(name = "price_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceInr;

    @Column(name = "gst_rate_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstRatePercent = new BigDecimal("5.00");

    @Column(name = "gst_amount_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal gstAmountInr = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total_inr", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lineTotalInr = BigDecimal.ZERO;
}
