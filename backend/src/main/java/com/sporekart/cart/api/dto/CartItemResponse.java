package com.sporekart.cart.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CartItemResponse {

    private UUID id;
    private UUID variantId;
    private UUID productId;
    private String productTitle;
    private String productSlug;
    private String variantName;
    private String sku;
    private BigDecimal unitPriceInr;
    private Integer quantity;
    private BigDecimal lineTotalInr;
    private Integer availableStock;
    private String imageUrl;
    private boolean inStock;

    public CartItemResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getVariantId() { return variantId; }
    public void setVariantId(UUID variantId) { this.variantId = variantId; }

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }

    public String getProductTitle() { return productTitle; }
    public void setProductTitle(String productTitle) { this.productTitle = productTitle; }

    public String getProductSlug() { return productSlug; }
    public void setProductSlug(String productSlug) { this.productSlug = productSlug; }

    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public BigDecimal getUnitPriceInr() { return unitPriceInr; }
    public void setUnitPriceInr(BigDecimal unitPriceInr) { this.unitPriceInr = unitPriceInr; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getLineTotalInr() { return lineTotalInr; }
    public void setLineTotalInr(BigDecimal lineTotalInr) { this.lineTotalInr = lineTotalInr; }

    public Integer getAvailableStock() { return availableStock; }
    public void setAvailableStock(Integer availableStock) { this.availableStock = availableStock; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }
}
