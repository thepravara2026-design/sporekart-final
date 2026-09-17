package com.sporekart.cart.api.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CartResponse {

    private UUID id;
    private UUID userId;
    private String sessionId;
    private List<CartItemResponse> items = new ArrayList<>();
    private BigDecimal subtotalInr;
    private BigDecimal gstTotalInr;
    private BigDecimal estimatedTotalInr;
    private Integer itemCount;
    private boolean valid;

    public CartResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public List<CartItemResponse> getItems() { return items; }
    public void setItems(List<CartItemResponse> items) { this.items = items; }

    public BigDecimal getSubtotalInr() { return subtotalInr; }
    public void setSubtotalInr(BigDecimal subtotalInr) { this.subtotalInr = subtotalInr; }

    public BigDecimal getGstTotalInr() { return gstTotalInr; }
    public void setGstTotalInr(BigDecimal gstTotalInr) { this.gstTotalInr = gstTotalInr; }

    public BigDecimal getEstimatedTotalInr() { return estimatedTotalInr; }
    public void setEstimatedTotalInr(BigDecimal estimatedTotalInr) { this.estimatedTotalInr = estimatedTotalInr; }

    public Integer getItemCount() { return itemCount; }
    public void setItemCount(Integer itemCount) { this.itemCount = itemCount; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
}
