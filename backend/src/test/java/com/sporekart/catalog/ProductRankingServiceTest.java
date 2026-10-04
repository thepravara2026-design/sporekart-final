package com.sporekart.catalog;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.ProductRankingService;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.review.domain.ReviewStatus;
import com.sporekart.review.infrastructure.ProductReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductRankingServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductReviewRepository reviewRepository;

    @InjectMocks
    private ProductRankingService rankingService;

    private UUID prod1Id;
    private UUID prod2Id;
    private UUID prod3Id;

    private CatalogDtos.ProductDto prod1;
    private CatalogDtos.ProductDto prod2;
    private CatalogDtos.ProductDto prod3;

    @BeforeEach
    void setUp() {
        prod1Id = UUID.randomUUID();
        prod2Id = UUID.randomUUID();
        prod3Id = UUID.randomUUID();

        CatalogDtos.VariantDto activeVariant1 = CatalogDtos.VariantDto.builder()
                .id(UUID.randomUUID())
                .variantName("Default 1")
                .priceInr(BigDecimal.valueOf(100))
                .stockQuantity(50)
                .isActive(true)
                .build();

        CatalogDtos.VariantDto activeVariant2 = CatalogDtos.VariantDto.builder()
                .id(UUID.randomUUID())
                .variantName("Default 2")
                .priceInr(BigDecimal.valueOf(200))
                .stockQuantity(10)
                .isActive(true)
                .build();

        CatalogDtos.VariantDto activeVariant3 = CatalogDtos.VariantDto.builder()
                .id(UUID.randomUUID())
                .variantName("Default 3")
                .priceInr(BigDecimal.valueOf(300))
                .stockQuantity(0) // Out of stock
                .isActive(true)
                .build();

        prod1 = CatalogDtos.ProductDto.builder()
                .id(prod1Id)
                .title("Oyster Mushroom Kit")
                .slug("oyster-mushroom-kit")
                .categorySlug("growing-kits")
                .variants(List.of(activeVariant1))
                .build();

        prod2 = CatalogDtos.ProductDto.builder()
                .id(prod2Id)
                .title("Button Spawn Seeds")
                .slug("button-spawn-seeds")
                .categorySlug("spawn-seeds")
                .variants(List.of(activeVariant2))
                .build();

        prod3 = CatalogDtos.ProductDto.builder()
                .id(prod3Id)
                .title("Dry Shiitake Mushrooms")
                .slug("dry-shiitake")
                .categorySlug("dry-mushrooms")
                .variants(List.of(activeVariant3))
                .build();
    }

    @Test
    @DisplayName("DISCOVERY-1: Correctly identifies Most Popular and Best Seller products based on data")
    void testEnrichAndRankProducts_DataDrivenBadges() {
        // Mock sales data: Prod1 has 50 sales, Prod2 has 5 sales
        List<Object[]> salesData = List.of(
                new Object[]{prod1Id, 50L},
                new Object[]{prod2Id, 5L}
        );
        when(orderRepository.findTopSellingProductIds()).thenReturn(salesData);

        // Mock review data: Prod2 has 25 reviews @ 4.9 rating, Prod1 has 1 review @ 5.0
        List<Object[]> reviewData = List.of(
                new Object[]{prod2Id, 4.9, 25L, 20L},
                new Object[]{prod1Id, 5.0, 1L, 1L}
        );
        when(reviewRepository.findReviewStatsGroupedByProduct(ReviewStatus.PUBLISHED)).thenReturn(reviewData);

        List<CatalogDtos.ProductDto> input = List.of(prod1, prod2, prod3);
        List<CatalogDtos.ProductDto> ranked = rankingService.enrichAndRankProducts(new ArrayList<>(input), null, null);

        assertNotNull(ranked);
        assertEquals(3, ranked.size());

        // Prod1 should be Best Seller
        assertTrue(prod1.isBestSeller());
        assertEquals(50L, prod1.getTotalUnitsSold());

        // Prod2 should be Most Popular because of review volume (25 reviews vs 1 review)
        assertTrue(prod2.isPopular());
        assertEquals(4.9, prod2.getAverageRating());
        assertEquals(25L, prod2.getReviewCount());

        // Prod3 has no sales or reviews, so neither badge
        assertFalse(prod3.isBestSeller());
        assertFalse(prod3.isPopular());
    }

    @Test
    @DisplayName("DISCOVERY-2: Preserves explicit sorting order while enriching discovery metadata")
    void testEnrichAndRankProducts_ExplicitSortingPreserved() {
        when(orderRepository.findTopSellingProductIds()).thenReturn(Collections.emptyList());
        when(reviewRepository.findReviewStatsGroupedByProduct(ReviewStatus.PUBLISHED)).thenReturn(Collections.emptyList());

        List<CatalogDtos.ProductDto> explicitList = List.of(prod3, prod1, prod2);
        List<CatalogDtos.ProductDto> result = rankingService.enrichAndRankProducts(new ArrayList<>(explicitList), null, "price_asc");

        // Explicit list order must be preserved 100%
        assertEquals(prod3Id, result.get(0).getId());
        assertEquals(prod1Id, result.get(1).getId());
        assertEquals(prod2Id, result.get(2).getId());
    }

    @Test
    @DisplayName("DISCOVERY-3: In-stock items prioritized over out-of-stock items in default discovery ranking")
    void testEnrichAndRankProducts_StockPriority() {
        when(orderRepository.findTopSellingProductIds()).thenReturn(Collections.emptyList());
        when(reviewRepository.findReviewStatsGroupedByProduct(ReviewStatus.PUBLISHED)).thenReturn(Collections.emptyList());

        // prod3 is Out of Stock, prod1 and prod2 are In Stock
        List<CatalogDtos.ProductDto> input = List.of(prod3, prod1, prod2);
        List<CatalogDtos.ProductDto> ranked = rankingService.enrichAndRankProducts(new ArrayList<>(input), null, null);

        // First two must be in-stock items (prod1 or prod2), prod3 must be last
        assertNotEquals(prod3Id, ranked.get(0).getId());
        assertEquals(prod3Id, ranked.get(2).getId());
    }
}
