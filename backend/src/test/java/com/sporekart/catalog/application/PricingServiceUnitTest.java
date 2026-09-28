package com.sporekart.catalog.application;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.CategoryRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PricingServiceUnitTest {

    @Spy
    private PricingService pricingService = new PricingService();

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private CatalogApplicationService catalogApplicationService;

    private Product testProduct;
    private ProductVariant testVariant;
    private UUID variantId;

    @BeforeEach
    void setUp() {
        variantId = UUID.randomUUID();

        testProduct = Product.builder()
                .id(UUID.randomUUID())
                .title("Button Mushroom")
                .slug("button-mushroom")
                .productType(ProductType.FRESH_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .gstRatePercent(new BigDecimal("5.00"))
                .isActive(true)
                .offers(new ArrayList<>())
                .variants(new ArrayList<>())
                .media(new ArrayList<>())
                .build();

        testVariant = ProductVariant.builder()
                .id(variantId)
                .product(testProduct)
                .variantName("250g Tray")
                .sku("SKU-BUTTON-250G")
                .compareAtPriceInr(new BigDecimal("150.00"))
                .priceInr(new BigDecimal("120.00"))
                .stockQuantity(25)
                .isActive(true)
                .build();

        testProduct.getVariants().add(testVariant);
    }

    @Test
    @DisplayName("CAT-1: PricingService calculatePrice with base price and no discount")
    void CAT_1_calculatePrice_noDiscount() {
        PricingService.PriceCalculationResult result = pricingService.calculatePrice(testProduct, testVariant);

        assertNotNull(result);
        assertEquals(new BigDecimal("120.00"), result.getBasePriceInr());
        assertEquals(BigDecimal.ZERO, result.getDiscountAmountInr());
        assertEquals(new BigDecimal("120.00"), result.getNetPriceInr());
        assertEquals(new BigDecimal("6.00"), result.getGstAmountInr()); // 5% of 120 = 6.00
        assertEquals(new BigDecimal("126.00"), result.getFinalPriceInr());
        assertNull(result.getAppliedOfferName());
    }

    @Test
    @DisplayName("CAT-2: PricingService calculatePrice applies percentage discount offer")
    void CAT_2_calculatePrice_percentageDiscount() {
        ProductOffer offer = ProductOffer.builder()
                .id(UUID.randomUUID())
                .product(testProduct)
                .offerName("Festive 10% Off")
                .discountPercent(new BigDecimal("10.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(1))
                .build();
        testProduct.setOffers(List.of(offer));

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(testProduct, testVariant);

        assertEquals(new BigDecimal("120.00"), result.getBasePriceInr());
        assertEquals(new BigDecimal("12.00"), result.getDiscountAmountInr()); // 10% of 120 = 12.00
        assertEquals(new BigDecimal("108.00"), result.getNetPriceInr());
        assertEquals(new BigDecimal("5.40"), result.getGstAmountInr()); // 5% of 108 = 5.40
        assertEquals(new BigDecimal("113.40"), result.getFinalPriceInr());
        assertEquals("Festive 10% Off", result.getAppliedOfferName());
    }

    @Test
    @DisplayName("CAT-3: PricingService calculatePrice applies fixed amount discount offer")
    void CAT_3_calculatePrice_fixedAmountDiscount() {
        ProductOffer offer = ProductOffer.builder()
                .id(UUID.randomUUID())
                .product(testProduct)
                .offerName("Flat ₹20 Off")
                .discountAmountInr(new BigDecimal("20.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(1))
                .build();
        testProduct.setOffers(List.of(offer));

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(testProduct, testVariant);

        assertEquals(new BigDecimal("20.00"), result.getDiscountAmountInr());
        assertEquals(new BigDecimal("100.00"), result.getNetPriceInr());
        assertEquals("Flat ₹20 Off", result.getAppliedOfferName());
    }

    @Test
    @DisplayName("CAT-4: PricingService calculatePrice computes GST amount correctly")
    void CAT_4_calculatePrice_gstComputation() {
        testProduct.setGstRatePercent(new BigDecimal("18.00"));

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(testProduct, testVariant);

        assertEquals(new BigDecimal("21.60"), result.getGstAmountInr()); // 18% of 120 = 21.60
        assertEquals(new BigDecimal("141.60"), result.getFinalPriceInr());
    }

    @Test
    @DisplayName("CAT-5: PricingService calculatePrice net price never drops below zero")
    void CAT_5_calculatePrice_netPriceFloorZero() {
        ProductOffer offer = ProductOffer.builder()
                .id(UUID.randomUUID())
                .product(testProduct)
                .offerName("Huge ₹200 Off")
                .discountAmountInr(new BigDecimal("200.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(1))
                .build();
        testProduct.setOffers(List.of(offer));

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(testProduct, testVariant);

        assertEquals(0, result.getNetPriceInr().compareTo(BigDecimal.ZERO));
        assertEquals(0, result.getFinalPriceInr().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("CAT-6: StockAvailability fromQuantity >20 returns AVAILABLE")
    void CAT_6_stockAvailability_available() {
        StockAvailability status = StockAvailability.fromQuantity(25);
        assertEquals(StockAvailability.AVAILABLE, status);
        assertEquals("Available", status.getLabel());
    }

    @Test
    @DisplayName("CAT-7: StockAvailability fromQuantity >10 and <=20 returns LIMITED_STOCK")
    void CAT_7_stockAvailability_limitedStock() {
        StockAvailability status = StockAvailability.fromQuantity(15);
        assertEquals(StockAvailability.LIMITED_STOCK, status);
        assertEquals("Limited stock", status.getLabel());
    }

    @Test
    @DisplayName("CAT-8: StockAvailability fromQuantity >0 and <=10 returns LOW_STOCK")
    void CAT_8_stockAvailability_lowStock() {
        StockAvailability status = StockAvailability.fromQuantity(5);
        assertEquals(StockAvailability.LOW_STOCK, status);
        assertEquals("Only a few left. Hurry!", status.getLabel());
    }

    @Test
    @DisplayName("CAT-9: StockAvailability fromQuantity <=0 returns OUT_OF_STOCK")
    void CAT_9_stockAvailability_outOfStock() {
        StockAvailability status = StockAvailability.fromQuantity(0);
        assertEquals(StockAvailability.OUT_OF_STOCK, status);
        assertEquals("Out of stock", status.getLabel());
    }

    @Test
    @DisplayName("CAT-10: CatalogApplicationService getAllActiveProducts filters active products")
    void CAT_10_getAllActiveProducts() {
        when(productRepository.findByIsActiveTrue()).thenReturn(List.of(testProduct));

        List<CatalogDtos.ProductDto> products = catalogApplicationService.getAllActiveProducts(null, null);

        assertFalse(products.isEmpty());
        assertEquals("Button Mushroom", products.get(0).getTitle());
    }

    @Test
    @DisplayName("CAT-11: CatalogApplicationService searchProducts paginates and returns Page")
    void CAT_11_searchProducts() {
        Page<Product> productPage = new PageImpl<>(List.of(testProduct));
        when(productRepository.searchProducts(any(), any(), any(), any(Pageable.class)))
                .thenReturn(productPage);

        Page<CatalogDtos.ProductDto> result = catalogApplicationService.searchProducts(
                null, ProductType.FRESH_MUSHROOM, "button", 0, 10, "price_asc"
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("CAT-12: CatalogApplicationService getProductBySlug throws exception for inactive product")
    void CAT_12_getProductBySlug_inactive() {
        testProduct.setActive(false);
        when(productRepository.findBySlug("button-mushroom")).thenReturn(Optional.of(testProduct));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                catalogApplicationService.getProductBySlug("button-mushroom")
        );
        assertTrue(ex.getMessage().contains("inactive or unavailable"));
    }

    @Test
    @DisplayName("CAT-13: CatalogApplicationService getAllCategories returns active categories")
    void CAT_13_getAllCategories() {
        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name("Fresh Mushrooms")
                .slug("fresh-mushrooms")
                .isActive(true)
                .build();
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<CatalogDtos.CategoryDto> dtos = catalogApplicationService.getAllCategories();

        assertEquals(1, dtos.size());
        assertEquals("Fresh Mushrooms", dtos.get(0).getName());
    }

    @Test
    @DisplayName("CAT-14: CatalogApplicationService validateAndGetVariant returns available status")
    void CAT_14_validateAndGetVariant_available() {
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));

        CatalogDtos.StockValidationResult result = catalogApplicationService.validateAndGetVariant(variantId, 5);

        assertTrue(result.isAvailable());
        assertEquals("Available", result.getMessage());
    }

    @Test
    @DisplayName("CAT-15: CatalogApplicationService validateAndGetVariant returns unavailable when insufficient stock")
    void CAT_15_validateAndGetVariant_insufficientStock() {
        testVariant.setStockQuantity(2);
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(testVariant));

        CatalogDtos.StockValidationResult result = catalogApplicationService.validateAndGetVariant(variantId, 10);

        assertFalse(result.isAvailable());
        assertEquals("Insufficient stock for requested quantity", result.getMessage());
    }

    @Test
    @DisplayName("CAT-16: CatalogApplicationService mapToProductDto maps variants with prices and stock label")
    void CAT_16_mapToProductDto() {
        CatalogDtos.ProductDto dto = catalogApplicationService.mapToProductDto(testProduct);

        assertNotNull(dto);
        assertEquals("Button Mushroom", dto.getTitle());
        assertEquals(1, dto.getVariants().size());
        assertEquals("Available", dto.getVariants().get(0).getAvailability().getLabel());
    }
}
