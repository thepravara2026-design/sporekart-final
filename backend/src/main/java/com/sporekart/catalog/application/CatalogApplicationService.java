package com.sporekart.catalog.application;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.CategoryRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogApplicationService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final PricingService pricingService;
    private final com.sporekart.order.infrastructure.OrderRepository orderRepository;
    private final ProductRankingService rankingService;

    @Transactional(readOnly = true)
    public UUID getMostPopularProductId() {
        try {
            List<Object[]> topSelling = orderRepository.findTopSellingProductIds();
            if (topSelling != null && !topSelling.isEmpty()) {
                Object[] top = topSelling.get(0);
                if (top != null && top.length > 0 && top[0] instanceof UUID uuid) {
                    return uuid;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.ProductDto> getAllActiveProducts(ProductType typeFilter, String categorySlug) {
        return getAllActiveProducts(typeFilter, categorySlug, 0, 1000);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.ProductDto> getAllActiveProducts(ProductType typeFilter, String categorySlug, int page, int size) {
        String cleanCategory = resolveCategorySlug(categorySlug);
        ProductType cleanType = typeFilter != null ? typeFilter : resolveProductType(categorySlug);

        List<Product> products;
        if (cleanCategory != null && !cleanCategory.isBlank()) {
            products = productRepository.findByCategorySlug(cleanCategory);
        } else if (cleanType != null) {
            products = productRepository.findByProductTypeAndIsActiveTrue(cleanType);
        } else {
            products = productRepository.findByIsActiveTrue();
        }

        List<CatalogDtos.ProductDto> dtos = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE && p.isActive())
                .map(this::mapToProductDto)
                .collect(Collectors.toList());

        List<CatalogDtos.ProductDto> rankedDtos = rankingService.enrichAndRankProducts(dtos, cleanCategory, null);

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        int fromIndex = safePage * safeSize;
        if (fromIndex >= rankedDtos.size()) {
            return List.of();
        }
        int toIndex = Math.min(rankedDtos.size(), fromIndex + safeSize);
        return rankedDtos.subList(fromIndex, toIndex);
    }

    @Transactional(readOnly = true)
    public Optional<ProductVariant> findVariantById(UUID variantId) {
        return variantRepository.findById(variantId);
    }

    @Transactional(readOnly = true)
    public Page<CatalogDtos.ProductDto> searchProducts(String categorySlug, ProductType productType, String searchQuery, int page, int size, String sortBy) {
        String cleanCategory = resolveCategorySlug(categorySlug);
        ProductType cleanType = productType != null ? productType : (cleanCategory != null ? null : resolveProductType(categorySlug));
        String cleanQuery = (searchQuery != null && !searchQuery.trim().isEmpty()) ? searchQuery.trim() : null;

        Page<Product> productPage;
        if ("price_asc".equalsIgnoreCase(sortBy)) {
            Pageable pageable = PageRequest.of(page, size);
            productPage = productRepository.searchProductsOrderByPriceAsc(cleanCategory, cleanType, cleanQuery, pageable);
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            Pageable pageable = PageRequest.of(page, size);
            productPage = productRepository.searchProductsOrderByPriceDesc(cleanCategory, cleanType, cleanQuery, pageable);
        } else {
            Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
            if ("title_asc".equalsIgnoreCase(sortBy)) {
                sort = Sort.by(Sort.Direction.ASC, "title");
            } else if ("title_desc".equalsIgnoreCase(sortBy)) {
                sort = Sort.by(Sort.Direction.DESC, "title");
            }
            Pageable pageable = PageRequest.of(page, size, sort);
            productPage = productRepository.searchProducts(cleanCategory, cleanType, cleanQuery, pageable);
        }

        List<CatalogDtos.ProductDto> rawDtos = productPage.getContent().stream()
                .map(this::mapToProductDto)
                .collect(Collectors.toList());

        List<CatalogDtos.ProductDto> enrichedContent = rankingService.enrichAndRankProducts(rawDtos, cleanCategory, sortBy);
        return new org.springframework.data.domain.PageImpl<>(enrichedContent, productPage.getPageable(), productPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.ProductDto> getMostPopularProducts(String categorySlug, int limit) {
        List<CatalogDtos.ProductDto> allActive = getAllActiveProducts(null, categorySlug, 0, 1000);
        return rankingService.filterPopularProducts(allActive, limit);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.ProductDto> getBestSellingProducts(String categorySlug, int limit) {
        List<CatalogDtos.ProductDto> allActive = getAllActiveProducts(null, categorySlug, 0, 1000);
        return rankingService.filterBestSellingProducts(allActive, limit);
    }

    private String resolveCategorySlug(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String raw = input.trim().toLowerCase().replace("_", "-");
        if ("mushroom-spawn".equals(raw) || "spawn-seed".equals(raw) || "spawn-seeds".equals(raw) || "spawn_seed".equals(raw)) {
            return "spawn-seeds";
        }
        if ("fresh-mushroom".equals(raw) || "fresh-mushrooms".equals(raw) || "fresh_mushroom".equals(raw)) {
            return "fresh-mushrooms";
        }
        if ("dry-mushroom".equals(raw) || "dry-mushrooms".equals(raw) || "dry_mushroom".equals(raw)) {
            return "dry-mushrooms";
        }
        if ("growing-kit".equals(raw) || "growing-kits".equals(raw) || "growing_kit".equals(raw)) {
            return "growing-kits";
        }
        if ("equipment-supplies".equals(raw) || "cultivation-supplies".equals(raw) || "cultivation-equipment-supplies".equals(raw) || "equipment_supplies".equals(raw) || "equipment".equals(raw)) {
            return "equipment-supplies";
        }
        return input.trim();
    }

    private ProductType resolveProductType(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String raw = input.trim().toUpperCase().replace("-", "_");
        if ("MUSHROOM_SPAWN".equals(raw) || "SPAWN_SEEDS".equals(raw) || "SPAWN_SEED".equals(raw)) {
            return ProductType.SPAWN_SEED;
        }
        if ("FRESH_MUSHROOMS".equals(raw) || "FRESH_MUSHROOM".equals(raw)) {
            return ProductType.FRESH_MUSHROOM;
        }
        if ("DRY_MUSHROOMS".equals(raw) || "DRY_MUSHROOM".equals(raw)) {
            return ProductType.DRY_MUSHROOM;
        }
        if ("GROWING_KITS".equals(raw) || "GROWING_KIT".equals(raw)) {
            return ProductType.GROWING_KIT;
        }
        if ("EQUIPMENT_SUPPLIES".equals(raw) || "CULTIVATION_SUPPLIES".equals(raw) || "EQUIPMENT".equals(raw)) {
            return ProductType.EQUIPMENT_SUPPLIES;
        }
        try {
            return ProductType.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public CatalogDtos.ProductDto getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with slug: " + slug));

        if (!product.isActive() || product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is inactive or unavailable");
        }

        CatalogDtos.ProductDto dto = mapToProductDto(product);
        List<CatalogDtos.ProductDto> enriched = rankingService.enrichAndRankProducts(List.of(dto), dto.getCategorySlug(), null);
        return enriched.isEmpty() ? dto : enriched.get(0);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .filter(Category::isActive)
                .map(c -> CatalogDtos.CategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .description(c.getDescription())
                        .imageUrl(c.getImageUrl())
                        .isActive(c.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CatalogDtos.StockValidationResult validateAndGetVariant(UUID variantId, int requestedQuantity) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + variantId));

        Product product = variant.getProduct();
        if (!product.isActive() || product.getStatus() != ProductStatus.ACTIVE || !variant.isActive()) {
            return CatalogDtos.StockValidationResult.builder()
                    .variantId(variantId)
                    .productTitle(product.getTitle())
                    .variantName(variant.getVariantName())
                    .unitPriceInr(variant.getPriceInr())
                    .isAvailable(false)
                    .message("Product variant is currently inactive or unavailable")
                    .build();
        }

        if (variant.getStockQuantity() < requestedQuantity) {
            return CatalogDtos.StockValidationResult.builder()
                    .variantId(variantId)
                    .productTitle(product.getTitle())
                    .variantName(variant.getVariantName())
                    .unitPriceInr(variant.getPriceInr())
                    .isAvailable(false)
                    .message("Insufficient stock for requested quantity")
                    .build();
        }

        PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(product, variant);

        return CatalogDtos.StockValidationResult.builder()
                .variantId(variantId)
                .productTitle(product.getTitle())
                .variantName(variant.getVariantName())
                .unitPriceInr(priceResult.getFinalPriceInr())
                .isAvailable(true)
                .message("Available")
                .build();
    }

    public CatalogDtos.ProductDto mapToProductDto(Product product) {
        List<CatalogDtos.VariantDto> variantDtos = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .map(v -> {
                    PricingService.PriceCalculationResult calc = pricingService.calculatePrice(product, v);
                    StockAvailability avail = StockAvailability.fromQuantity(v.getStockQuantity());
                    return CatalogDtos.VariantDto.builder()
                            .id(v.getId())
                            .variantName(v.getVariantName())
                            .sku(v.getSku())
                            .priceInr(v.getPriceInr())
                            .compareAtPriceInr(v.getCompareAtPriceInr())
                            .calculatedFinalPriceInr(calc.getFinalPriceInr())
                            .calculatedGstAmountInr(calc.getGstAmountInr())
                            .appliedOfferName(calc.getAppliedOfferName())
                            .stockQuantity(v.getStockQuantity())
                            .availability(CatalogDtos.AvailabilityDto.builder()
                                    .status(avail)
                                    .label(avail.getLabel())
                                    .build())
                            .isActive(v.isActive())
                            .build();
                })
                .collect(Collectors.toList());

        List<CatalogDtos.MediaDto> mediaDtos = product.getMedia().stream()
                .sorted(Comparator.comparingInt(ProductMedia::getDisplayOrder))
                .map(m -> CatalogDtos.MediaDto.builder()
                        .id(m.getId())
                        .variantId(m.getVariantId())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .role(m.getRole() != null ? m.getRole() : ProductMediaRole.GALLERY)
                        .isPrimary(m.isPrimary())
                        .displayOrder(m.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        List<String> imageUrls = mediaDtos.stream()
                .filter(m -> m.getMediaType() == MediaType.IMAGE)
                .map(CatalogDtos.MediaDto::getMediaUrl)
                .collect(Collectors.toList());

        List<CatalogDtos.OfferDto> offerDtos = new ArrayList<>();
        if (product.getOffers() != null) {
            offerDtos = product.getOffers().stream()
                    .map(o -> CatalogDtos.OfferDto.builder()
                            .id(o.getId())
                            .variantId(o.getVariantId())
                            .offerName(o.getOfferName())
                            .discountPercent(o.getDiscountPercent())
                            .discountAmountInr(o.getDiscountAmountInr())
                            .validFrom(o.getValidFrom())
                            .validTo(o.getValidTo())
                            .isCurrentlyValid(o.isCurrentlyValid())
                            .build())
                    .collect(Collectors.toList());
        }

        CatalogDtos.ProductInformationDto infoDto = mapToProductInformationDto(product.getProductInformation());
        UUID popularId = getMostPopularProductId();
        boolean isPopular = (popularId != null && popularId.equals(product.getId()));

        return CatalogDtos.ProductDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .slug(product.getSlug())
                .description(product.getDescription())
                .productType(product.getProductType())
                .status(product.getStatus())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "General")
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : "general")
                .hsnCode(product.getHsnCode())
                .gstRatePercent(product.getGstRatePercent())
                .metaTitle(product.getMetaTitle())
                .metaDescription(product.getMetaDescription())
                .canonicalUrl(product.getCanonicalUrl())
                .variants(variantDtos)
                .media(mediaDtos)
                .imageUrls(imageUrls)
                .activeOffers(offerDtos)
                .productInformation(infoDto)
                .isActive(product.isActive())
                .isPopular(isPopular)
                .build();
    }

    public CatalogDtos.AdminProductDto mapToAdminProductDto(Product product) {
        List<CatalogDtos.AdminVariantDto> variantDtos = product.getVariants().stream()
                .map(v -> {
                    PricingService.PriceCalculationResult calc = pricingService.calculatePrice(product, v);
                    StockAvailability avail = StockAvailability.fromQuantity(v.getStockQuantity());
                    return CatalogDtos.AdminVariantDto.builder()
                            .id(v.getId())
                            .variantName(v.getVariantName())
                            .sku(v.getSku())
                            .priceInr(v.getPriceInr())
                            .compareAtPriceInr(v.getCompareAtPriceInr())
                            .calculatedFinalPriceInr(calc.getFinalPriceInr())
                            .calculatedGstAmountInr(calc.getGstAmountInr())
                            .appliedOfferName(calc.getAppliedOfferName())
                            .stockQuantity(v.getStockQuantity())
                            .availability(CatalogDtos.AvailabilityDto.builder()
                                    .status(avail)
                                    .label(avail.getLabel())
                                    .build())
                            .isActive(v.isActive())
                            .build();
                })
                .collect(Collectors.toList());

        List<CatalogDtos.MediaDto> mediaDtos = product.getMedia().stream()
                .sorted(Comparator.comparingInt(ProductMedia::getDisplayOrder))
                .map(m -> CatalogDtos.MediaDto.builder()
                        .id(m.getId())
                        .variantId(m.getVariantId())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .role(m.getRole() != null ? m.getRole() : ProductMediaRole.GALLERY)
                        .isPrimary(m.isPrimary())
                        .displayOrder(m.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        List<String> imageUrls = mediaDtos.stream()
                .filter(m -> m.getMediaType() == MediaType.IMAGE)
                .map(CatalogDtos.MediaDto::getMediaUrl)
                .collect(Collectors.toList());

        List<CatalogDtos.OfferDto> offerDtos = new ArrayList<>();
        if (product.getOffers() != null) {
            offerDtos = product.getOffers().stream()
                    .map(o -> CatalogDtos.OfferDto.builder()
                            .id(o.getId())
                            .variantId(o.getVariantId())
                            .offerName(o.getOfferName())
                            .discountPercent(o.getDiscountPercent())
                            .discountAmountInr(o.getDiscountAmountInr())
                            .validFrom(o.getValidFrom())
                            .validTo(o.getValidTo())
                            .isCurrentlyValid(o.isCurrentlyValid())
                            .build())
                    .collect(Collectors.toList());
        }

        CatalogDtos.ProductInformationDto infoDto = mapToProductInformationDto(product.getProductInformation());
        UUID popularId = getMostPopularProductId();
        boolean isPopular = (popularId != null && popularId.equals(product.getId()));

        return CatalogDtos.AdminProductDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .slug(product.getSlug())
                .description(product.getDescription())
                .productType(product.getProductType())
                .status(product.getStatus())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "General")
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : "general")
                .hsnCode(product.getHsnCode())
                .gstRatePercent(product.getGstRatePercent())
                .metaTitle(product.getMetaTitle())
                .metaDescription(product.getMetaDescription())
                .canonicalUrl(product.getCanonicalUrl())
                .variants(variantDtos)
                .media(mediaDtos)
                .imageUrls(imageUrls)
                .activeOffers(offerDtos)
                .productInformation(infoDto)
                .isActive(product.isActive())
                .isPopular(isPopular)
                .build();
    }

    private CatalogDtos.ProductInformationDto mapToProductInformationDto(ProductInformation info) {
        if (info == null) return null;
        return CatalogDtos.ProductInformationDto.builder()
                .id(info.getId())
                .brandName(info.getBrandName())
                .countryOfOrigin(info.getCountryOfOrigin())
                .manufacturerDetails(info.getManufacturerDetails())
                .packerDetails(info.getPackerDetails())
                .marketerDetails(info.getMarketerDetails())
                .customerCareDetails(info.getCustomerCareDetails())
                .netQuantity(info.getNetQuantity())
                .unitOfMeasure(info.getUnitOfMeasure())
                .fssaiLicenseNumber(info.getFssaiLicenseNumber())
                .foodCategory(info.getFoodCategory())
                .isVegetarian(info.isVegetarian())
                .ingredients(info.getIngredients())
                .allergenInfo(info.getAllergenInfo())
                .nutritionalInfoJson(info.getNutritionalInfoJson())
                .servingSize(info.getServingSize())
                .mushroomSpecies(info.getMushroomSpecies())
                .cultivationMethod(info.getCultivationMethod())
                .strainVariety(info.getStrainVariety())
                .recommendedSubstrate(info.getRecommendedSubstrate())
                .inoculationGuidance(info.getInoculationGuidance())
                .kitContents(info.getKitContents())
                .cultivationCycleDays(info.getCultivationCycleDays())
                .environmentRequirements(info.getEnvironmentRequirements())
                .storageInstructions(info.getStorageInstructions())
                .storageTemperatureGuidance(info.getStorageTemperatureGuidance())
                .shelfLifeGuidance(info.getShelfLifeGuidance())
                .handlingInstructions(info.getHandlingInstructions())
                .safetyWarnings(info.getSafetyWarnings())
                .build();
    }
}
