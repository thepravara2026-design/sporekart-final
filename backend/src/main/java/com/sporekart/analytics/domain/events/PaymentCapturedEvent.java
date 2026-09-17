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
public class PaymentCapturedEvent {
    private UUID paymentId;
    private UUID orderId;
    private BigDecimal amountInr;
    private String razorpayPaymentId;
}
