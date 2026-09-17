package com.sporekart.analytics.domain.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductViewedEvent {
    private UUID productId;
    private String productSlug;
    private String productTitle;
    private UUID userId;
}
