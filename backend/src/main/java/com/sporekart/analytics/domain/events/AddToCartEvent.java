package com.sporekart.analytics.domain.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartEvent {
    private UUID variantId;
    private int quantity;
    private BigDecimal priceInr;
    private UUID userId;
    private String sessionId;
}
