package com.sporekart.catalog;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.application.PricingService;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CatalogModuleTest {

    @Autowired
    private AdminCatalogService adminCatalogService;

    @Autowired
    private CatalogApplicationService catalogService;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductOfferRepository offerRepository;

    @BeforeEach
    void setUp() {
        offerRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void testDuplicateSlugPrevention() {
        CatalogDtos.CreateCategoryRequest catReq = new CatalogDtos.CreateCategoryRequest("Fresh", "fresh-mushrooms", "Desc", null, true);
        adminCatalogService.createCategory(catReq);

        Exception catEx = assertThrows(IllegalArgumentException.class, () -> adminCatalogService.createCategory(catReq));
        assertTrue(catEx.getMessage().contains("Duplicate category slug"));

        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setFssaiLicenseNumber("10020011000123");

        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(null, "Button Mushroom 200g", "fresh-button-200g", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE, "07095900", new BigDecimal("5.00"), "Title", "Desc", "url", true, infoReq);
        adminCatalogService.createProduct(prodReq);

        Exception prodEx = assertThrows(IllegalArgumentException.class, () -> adminCatalogService.createProduct(prodReq));
        assertTrue(prodEx.getMessage().contains("Duplicate product slug"));
    }

    @Test
    void testInactiveProductFiltering() {
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setFssaiLicenseNumber("10020011000123");

        CatalogDtos.CreateProductRequest activeProd = new CatalogDtos.CreateProductRequest(null, "Active Button", "active-button", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", true, infoReq);
        CatalogDtos.CreateProductRequest inactiveProd = new CatalogDtos.CreateProductRequest(null, "Draft Button", "draft-button", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.DRAFT, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", false, infoReq);

        adminCatalogService.createProduct(activeProd);
        adminCatalogService.createProduct(inactiveProd);

        List<CatalogDtos.ProductDto> activeList = catalogService.getAllActiveProducts(null, null);
        assertEquals(1, activeList.size());
        assertEquals("active-button", activeList.get(0).getSlug());

        Exception ex = assertThrows(IllegalArgumentException.class, () -> catalogService.getProductBySlug("draft-button"));
        assertTrue(ex.getMessage().contains("inactive or unavailable"));
    }

    @Test
    void testPriceValidation() {
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setKitContents("Substrate block & sprayer");

        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(null, "Oyster Kit", "oyster-kit", "Desc", ProductType.GROWING_KIT, ProductStatus.ACTIVE, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", true, infoReq);
        Product product = adminCatalogService.createProduct(prodReq);

        // Invalid price: compareAtPrice < priceInr
        CatalogDtos.CreateVariantRequest invalidVariant = new CatalogDtos.CreateVariantRequest("Kit Variant", "SKU-INVALID", new BigDecimal("500.00"), new BigDecimal("400.00"), 10, true);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> adminCatalogService.addVariant(product.getId(), invalidVariant));
        assertTrue(ex.getMessage().contains("Compare at price (MRP) cannot be less than selling price"));
    }

    @Test
    void testOfferValidityAndPriceCalculation() {
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setMushroomSpecies("Pleurotus ostreatus");

        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(null, "Grain Spawn 1kg", "grain-spawn-1kg", "Desc", ProductType.SPAWN_SEED, ProductStatus.ACTIVE, "0709", new BigDecimal("5.00"), "Meta", "Desc", "url", true, infoReq);
        Product product = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest variantReq = new CatalogDtos.CreateVariantRequest("1kg Bag", "SKU-SPAWN-1KG", new BigDecimal("200.00"), new BigDecimal("250.00"), 50, true);
        ProductVariant variant = adminCatalogService.addVariant(product.getId(), variantReq);

        // Add Active Offer: ₹20 flat discount
        CatalogDtos.CreateOfferRequest offerReq = new CatalogDtos.CreateOfferRequest(
                product.getId(),
                variant.getId(),
                "Festival Special ₹20 Off",
                BigDecimal.ZERO,
                new BigDecimal("20.00"),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(5),
                true
        );
        adminCatalogService.createOffer(offerReq);

        // Fetch refreshed product with offers
        Product refreshedProduct = productRepository.findById(product.getId()).orElseThrow();
        PricingService.PriceCalculationResult calc = pricingService.calculatePrice(refreshedProduct, variant);

        assertEquals(new BigDecimal("200.00"), calc.getBasePriceInr());
        assertEquals(new BigDecimal("20.00"), calc.getDiscountAmountInr());
        assertEquals(new BigDecimal("180.00"), calc.getNetPriceInr());
        assertEquals(new BigDecimal("9.00"), calc.getGstAmountInr()); // 5% GST on ₹180 = ₹9.00
        assertEquals(new BigDecimal("189.00"), calc.getFinalPriceInr()); // Net ₹180 + GST ₹9 = ₹189.00
    }

    @Test
    void testInventoryValidation() {
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setFssaiLicenseNumber("10020011000123");

        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(null, "Fresh Milky", "fresh-milky", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", true, infoReq);
        Product product = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest variantReq = new CatalogDtos.CreateVariantRequest("200g Pack", "SKU-MILKY-200G", new BigDecimal("80.00"), new BigDecimal("100.00"), 5, true);
        ProductVariant variant = adminCatalogService.addVariant(product.getId(), variantReq);

        // Request 3 items (In stock)
        CatalogDtos.StockValidationResult res1 = catalogService.validateAndGetVariant(variant.getId(), 3);
        assertTrue(res1.isAvailable());

        // Request 10 items (Exceeds stock of 5)
        CatalogDtos.StockValidationResult res2 = catalogService.validateAndGetVariant(variant.getId(), 10);
        assertFalse(res2.isAvailable());
        assertTrue(res2.getMessage().contains("Insufficient stock"));
    }

    @Test
    void testPublicApiHidesExactStockAndAdminApiExposesIt() {
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setFssaiLicenseNumber("10020011000123");

        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(null, "Button Mushroom 200g", "button-200g", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", true, infoReq);
        Product product = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest variantReq = new CatalogDtos.CreateVariantRequest("200g Pack", "SKU-BM-15", new BigDecimal("80.00"), new BigDecimal("100.00"), 15, true);
        adminCatalogService.addVariant(product.getId(), variantReq);

        // Public API DTO mapping
        CatalogDtos.ProductDto publicDto = catalogService.getProductBySlug("button-200g");
        assertNotNull(publicDto);
        assertEquals(1, publicDto.getVariants().size());
        CatalogDtos.VariantDto publicVariant = publicDto.getVariants().get(0);
        
        assertNotNull(publicVariant.getAvailability());
        assertEquals(StockAvailability.LIMITED_STOCK, publicVariant.getAvailability().getStatus());
        assertEquals("Limited stock", publicVariant.getAvailability().getLabel());

        // Admin API DTO mapping
        CatalogDtos.AdminProductDto adminDto = catalogService.mapToAdminProductDto(productRepository.findById(product.getId()).orElseThrow());
        assertNotNull(adminDto);
        assertEquals(1, adminDto.getVariants().size());
        CatalogDtos.AdminVariantDto adminVariant = adminDto.getVariants().get(0);

        assertEquals(15, adminVariant.getStockQuantity()); // Admin retains exact stock
        assertEquals(StockAvailability.LIMITED_STOCK, adminVariant.getAvailability().getStatus());
    }

    @Test
    void testPublishValidationRequiresFssaiForFoodProducts() {
        // Create draft product without FSSAI
        CatalogDtos.CreateProductRequest draftReq = new CatalogDtos.CreateProductRequest(null, "Fresh Button Draft", "fresh-button-draft", "Desc", ProductType.FRESH_MUSHROOM, ProductStatus.DRAFT, "0709", BigDecimal.ZERO, "Meta", "Desc", "url", true, null);
        Product draftProduct = adminCatalogService.createProduct(draftReq);
        assertEquals(ProductStatus.DRAFT, draftProduct.getStatus());

        // Attempting to publish without FSSAI info must throw exception
        Exception ex = assertThrows(IllegalArgumentException.class, () -> adminCatalogService.publishProduct(draftProduct.getId()));
        assertTrue(ex.getMessage().contains("FSSAI License Number is required"));

        // Now save FSSAI info and publish
        CatalogDtos.CreateProductInformationRequest infoReq = new CatalogDtos.CreateProductInformationRequest();
        infoReq.setFssaiLicenseNumber("14020099887766");
        adminCatalogService.saveOrUpdateProductInformation(draftProduct, infoReq);

        Product publishedProduct = adminCatalogService.publishProduct(draftProduct.getId());
        assertEquals(ProductStatus.ACTIVE, publishedProduct.getStatus());
    }
}
