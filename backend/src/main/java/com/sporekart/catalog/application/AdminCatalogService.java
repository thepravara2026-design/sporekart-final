package com.sporekart.catalog.application;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductOfferRepository offerRepository;
    private final ProductMediaRepository mediaRepository;
    private final ProductInformationRepository informationRepository;

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
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.DRAFT)
                .hsnCode(request.getHsnCode())
                .gstRatePercent(request.getGstRatePercent())
                .metaTitle(request.getMetaTitle())
                .metaDescription(request.getMetaDescription())
                .canonicalUrl(request.getCanonicalUrl())
                .isActive(request.isActive())
                .build();

        Product savedProduct = productRepository.save(product);

        if (request.getProductInformation() != null) {
            saveOrUpdateProductInformation(savedProduct, request.getProductInformation());
            if (savedProduct.getStatus() == ProductStatus.ACTIVE) {
                validateProductForPublication(savedProduct);
            }
        }

        return savedProduct;
    }

    @Transactional
    public ProductInformation saveOrUpdateProductInformation(Product product, CatalogDtos.CreateProductInformationRequest request) {
        ProductInformation info = informationRepository.findByProductId(product.getId())
                .orElseGet(() -> ProductInformation.builder().product(product).build());

        if (request.getBrandName() != null) info.setBrandName(request.getBrandName());
        if (request.getCountryOfOrigin() != null) info.setCountryOfOrigin(request.getCountryOfOrigin());
        if (request.getManufacturerDetails() != null) info.setManufacturerDetails(request.getManufacturerDetails());
        if (request.getPackerDetails() != null) info.setPackerDetails(request.getPackerDetails());
        if (request.getMarketerDetails() != null) info.setMarketerDetails(request.getMarketerDetails());
        if (request.getCustomerCareDetails() != null) info.setCustomerCareDetails(request.getCustomerCareDetails());
        if (request.getNetQuantity() != null) info.setNetQuantity(request.getNetQuantity());
        if (request.getUnitOfMeasure() != null) info.setUnitOfMeasure(request.getUnitOfMeasure());

        if (request.getFssaiLicenseNumber() != null) info.setFssaiLicenseNumber(request.getFssaiLicenseNumber());
        if (request.getFoodCategory() != null) info.setFoodCategory(request.getFoodCategory());
        info.setVegetarian(request.isVegetarian());
        if (request.getIngredients() != null) info.setIngredients(request.getIngredients());
        if (request.getAllergenInfo() != null) info.setAllergenInfo(request.getAllergenInfo());
        if (request.getNutritionalInfoJson() != null) info.setNutritionalInfoJson(request.getNutritionalInfoJson());
        if (request.getServingSize() != null) info.setServingSize(request.getServingSize());

        if (request.getMushroomSpecies() != null) info.setMushroomSpecies(request.getMushroomSpecies());
        if (request.getCultivationMethod() != null) info.setCultivationMethod(request.getCultivationMethod());
        if (request.getStrainVariety() != null) info.setStrainVariety(request.getStrainVariety());
        if (request.getRecommendedSubstrate() != null) info.setRecommendedSubstrate(request.getRecommendedSubstrate());
        if (request.getInoculationGuidance() != null) info.setInoculationGuidance(request.getInoculationGuidance());
        if (request.getKitContents() != null) info.setKitContents(request.getKitContents());
        if (request.getCultivationCycleDays() != null) info.setCultivationCycleDays(request.getCultivationCycleDays());
        if (request.getEnvironmentRequirements() != null) info.setEnvironmentRequirements(request.getEnvironmentRequirements());

        if (request.getStorageInstructions() != null) info.setStorageInstructions(request.getStorageInstructions());
        if (request.getStorageTemperatureGuidance() != null) info.setStorageTemperatureGuidance(request.getStorageTemperatureGuidance());
        if (request.getShelfLifeGuidance() != null) info.setShelfLifeGuidance(request.getShelfLifeGuidance());
        if (request.getHandlingInstructions() != null) info.setHandlingInstructions(request.getHandlingInstructions());
        if (request.getSafetyWarnings() != null) info.setSafetyWarnings(request.getSafetyWarnings());

        ProductInformation savedInfo = informationRepository.save(info);
        product.setProductInformation(savedInfo);
        return savedInfo;
    }

    @Transactional
    public Product publishProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        validateProductForPublication(product);

        product.setStatus(ProductStatus.ACTIVE);
        product.setActive(true);
        return productRepository.save(product);
    }

    public void validateProductForPublication(Product product) {
        ProductInformation info = product.getProductInformation();

        // Food products require FSSAI License Number
        if (product.getProductType() == ProductType.FRESH_MUSHROOM || product.getProductType() == ProductType.DRY_MUSHROOM) {
            if (info == null || info.getFssaiLicenseNumber() == null || info.getFssaiLicenseNumber().trim().isBlank()) {
                throw new IllegalArgumentException("FSSAI License Number is required for publishing food products (" + product.getProductType() + ")");
            }
        } else if (info == null) {
            throw new IllegalArgumentException("Product cannot be published without product information");
        }

        // Agritech / Spawn / Kit products require cultivation or substrate details
        if (product.getProductType() == ProductType.SPAWN_SEED) {
            if ((info.getStrainVariety() == null || info.getStrainVariety().isBlank()) &&
                (info.getMushroomSpecies() == null || info.getMushroomSpecies().isBlank())) {
                throw new IllegalArgumentException("Species or strain variety is required for publishing spawn seed products");
            }
        }

        if (product.getProductType() == ProductType.GROWING_KIT) {
            if (info.getKitContents() == null || info.getKitContents().isBlank()) {
                throw new IllegalArgumentException("Kit contents details are required for publishing growing kit products");
            }
        }
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

        if (request.isPrimary()) {
            // Unset previous primary image
            for (ProductMedia m : product.getMedia()) {
                if (m.isPrimary()) {
                    m.setPrimary(false);
                    mediaRepository.save(m);
                }
            }
        }

        ProductMedia media = ProductMedia.builder()
                .product(product)
                .variantId(request.getVariantId())
                .mediaUrl(request.getMediaUrl())
                .mediaType(request.getMediaType() != null ? request.getMediaType() : MediaType.IMAGE)
                .role(request.getRole() != null ? request.getRole() : ProductMediaRole.GALLERY)
                .isPrimary(request.isPrimary())
                .displayOrder(request.getDisplayOrder())
                .build();

        ProductMedia saved = mediaRepository.save(media);
        product.getMedia().add(saved);
        return saved;
    }

    @Transactional
    public List<ProductMedia> updateMediaOrder(UUID productId, CatalogDtos.UpdateMediaOrderRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        if (request.getItems() != null) {
            for (CatalogDtos.UpdateMediaOrderRequest.MediaOrderItem item : request.getItems()) {
                mediaRepository.findById(item.getMediaId()).ifPresent(m -> {
                    if (m.getProduct().getId().equals(productId)) {
                        m.setDisplayOrder(item.getDisplayOrder());
                        m.setPrimary(item.isPrimary());
                        if (item.getRole() != null) {
                            m.setRole(item.getRole());
                        }
                        mediaRepository.save(m);
                    }
                });
            }
        }

        return mediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
    }
}
