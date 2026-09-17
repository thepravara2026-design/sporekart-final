package com.sporekart.catalog.api;

import com.sporekart.catalog.domain.MediaType;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CatalogDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDto {
        private UUID id;
        private String name;
        private String slug;
        private String description;
        private String imageUrl;
        private boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaDto {
        private UUID id;
        private UUID variantId;
        private String mediaUrl;
        private MediaType mediaType;
        private boolean isPrimary;
        private int displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfferDto {
        private UUID id;
        private UUID variantId;
        private String offerName;
        private BigDecimal discountPercent;
        private BigDecimal discountAmountInr;
        private LocalDateTime validFrom;
        private LocalDateTime validTo;
        private boolean isCurrentlyValid;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantDto {
        private UUID id;
        private String variantName;
        private String sku;
        private BigDecimal priceInr;
        private BigDecimal compareAtPriceInr;
        private BigDecimal calculatedFinalPriceInr;
        private BigDecimal calculatedGstAmountInr;
        private String appliedOfferName;
        private int stockQuantity;
        private boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDto {
        private UUID id;
        private String title;
        private String slug;
        private String description;
        private ProductType productType;
        private ProductStatus status;
        private String categoryName;
        private String categorySlug;
        private String hsnCode;
        private BigDecimal gstRatePercent;
        private String metaTitle;
        private String metaDescription;
        private String canonicalUrl;
        private List<VariantDto> variants;
        private List<MediaDto> media;
        private List<String> imageUrls;
        private List<OfferDto> activeOffers;
        private boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockValidationResult {
        private UUID variantId;
        private String productTitle;
        private String variantName;
        private BigDecimal unitPriceInr;
        private boolean isAvailable;
        private String message;
    }

    // Admin Request DTOs
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCategoryRequest {
        @NotBlank(message = "Category name is required")
        private String name;
        @NotBlank(message = "Category slug is required")
        private String slug;
        private String description;
        private String imageUrl;
        private boolean isActive = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateProductRequest {
        private UUID categoryId;
        @NotBlank(message = "Product title is required")
        private String title;
        @NotBlank(message = "Product slug is required")
        private String slug;
        private String description;
        @NotNull(message = "Product type is required")
        private ProductType productType;
        private ProductStatus status = ProductStatus.ACTIVE;
        private String hsnCode;
        private BigDecimal gstRatePercent = BigDecimal.ZERO;
        private String metaTitle;
        private String metaDescription;
        private String canonicalUrl;
        private boolean isActive = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateVariantRequest {
        @NotBlank(message = "Variant name is required")
        private String variantName;
        @NotBlank(message = "SKU is required")
        private String sku;
        @NotNull(message = "Price is required")
        @Min(value = 0, message = "Price cannot be negative")
        private BigDecimal priceInr;
        private BigDecimal compareAtPriceInr;
        @Min(value = 0, message = "Stock quantity cannot be negative")
        private int stockQuantity;
        private boolean isActive = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOfferRequest {
        @NotNull(message = "Product ID is required")
        private UUID productId;
        private UUID variantId;
        @NotBlank(message = "Offer name is required")
        private String offerName;
        private BigDecimal discountPercent;
        private BigDecimal discountAmountInr;
        @NotNull(message = "Valid from date is required")
        private LocalDateTime validFrom;
        @NotNull(message = "Valid to date is required")
        private LocalDateTime validTo;
        private boolean isActive = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateMediaRequest {
        @NotNull(message = "Product ID is required")
        private UUID productId;
        private UUID variantId;
        @NotBlank(message = "Media URL is required")
        private String mediaUrl;
        private MediaType mediaType = MediaType.IMAGE;
        private boolean isPrimary;
        private int displayOrder;
    }
}
