package com.sporekart.order.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class OrderItemResponse {

    private UUID id;
    private UUID variantId;
    private String productTitle;
    private String variantName;
    private String sku;
    private BigDecimal priceInr;
    private BigDecimal gstRatePercent;
    private BigDecimal gstAmountInr;
    private Integer quantity;
    private BigDecimal lineTotalInr;

    public OrderItemResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getVariantId() { return variantId; }
    public void setVariantId(UUID variantId) { this.variantId = variantId; }

    public String getProductTitle() { return productTitle; }
    public void setProductTitle(String productTitle) { this.productTitle = productTitle; }

    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public BigDecimal getPriceInr() { return priceInr; }
    public void setPriceInr(BigDecimal priceInr) { this.priceInr = priceInr; }

    public BigDecimal getGstRatePercent() { return gstRatePercent; }
    public void setGstRatePercent(BigDecimal gstRatePercent) { this.gstRatePercent = gstRatePercent; }

    public BigDecimal getGstAmountInr() { return gstAmountInr; }
    public void setGstAmountInr(BigDecimal gstAmountInr) { this.gstAmountInr = gstAmountInr; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getLineTotalInr() { return lineTotalInr; }
    public void setLineTotalInr(BigDecimal lineTotalInr) { this.lineTotalInr = lineTotalInr; }
}
