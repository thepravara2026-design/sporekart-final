package com.sporekart.catalog.application;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductOfferRepository offerRepository;
    private final ProductMediaRepository mediaRepository;

    @Transactional
    public Category createCategory(CatalogDtos.CreateCategoryRequest request) {
        String slug = request.getSlug().trim().toLowerCase();
        if (categoryRepository.findBySlug(slug).isPresent()) {
            throw new IllegalArgumentException("Duplicate category slug: " + slug);
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isActive(request.isActive())
                .build();

        return categoryRepository.save(category);
    }

    @Transactional
    public Product createProduct(CatalogDtos.CreateProductRequest request) {
        String slug = request.getSlug().trim().toLowerCase();
        if (productRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Duplicate product slug: " + slug);
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));
        }

        Product product = Product.builder()
                .category(category)
                .title(request.getTitle().trim())
                .slug(slug)
                .description(request.getDescription())
                .productType(request.getProductType())
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE)
                .hsnCode(request.getHsnCode())
                .gstRatePercent(request.getGstRatePercent())
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .canonicalUrl(request.getCanonicalUrl())
                .isActive(request.isActive())
                .build();

        return productRepository.save(product);
    }

    @Transactional
    public ProductVariant addVariant(UUID productId, CatalogDtos.CreateVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        if (variantRepository.findBySku(request.getSku()).isPresent()) {
            throw new IllegalArgumentException("Duplicate SKU: " + request.getSku());
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .variantName(request.getVariantName())
                .sku(request.getSku())
                .priceInr(request.getPriceInr())
                .compareAtPriceInr(request.getCompareAtPriceInr())
                .stockQuantity(request.getStockQuantity())
                .isActive(request.isActive())
                .build();

        variant.validatePricing();
        ProductVariant saved = variantRepository.save(variant);
        product.getVariants().add(saved);
        return saved;
    }

    @Transactional
    public ProductOffer createOffer(CatalogDtos.CreateOfferRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));

        if (request.getValidFrom() != null && request.getValidTo() != null && request.getValidTo().isBefore(request.getValidFrom())) {
            throw new IllegalArgumentException("Offer validTo date cannot be before validFrom date");
        }

        ProductOffer offer = ProductOffer.builder()
                .product(product)
                .variantId(request.getVariantId())
                .offerName(request.getOfferName())
                .discountPercent(request.getDiscountPercent())
                .discountAmountInr(request.getDiscountAmountInr())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .isActive(request.isActive())
                .build();

        ProductOffer saved = offerRepository.save(offer);
        product.getOffers().add(saved);
        return saved;
    }

    @Transactional
    public ProductMedia addMedia(CatalogDtos.CreateMediaRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));

        ProductMedia media = ProductMedia.builder()
                .product(product)
                .variantId(request.getVariantId())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType() != null ? request.getMediaType() : MediaType.IMAGE)
                .isPrimary(request.isPrimary())
                .displayOrder(request.getDisplayOrder())
                .build();

        ProductMedia saved = mediaRepository.save(media);
        product.getMedia().add(saved);
        return saved;
    }
}
