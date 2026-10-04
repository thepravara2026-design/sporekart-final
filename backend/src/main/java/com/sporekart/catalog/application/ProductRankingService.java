package com.sporekart.catalog.application;

import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.review.domain.ReviewStatus;
import com.sporekart.review.infrastructure.ProductReviewRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductRankingService {

    private final OrderRepository orderRepository;
    private final ProductReviewRepository reviewRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductMetrics {
        private UUID productId;
        @Builder.Default
        private long totalUnitsSold = 0L;
        @Builder.Default
        private double averageRating = 0.0;
        @Builder.Default
        private long reviewCount = 0L;
        @Builder.Default
        private long verifiedCount = 0L;

        public double getPopularityScore() {
            if (reviewCount == 0) return 0.0;
            // Bayesian weighted average with m=2 prior weight & C=4.0 baseline expectation + verified review boost
            double m = 2.0;
            double c = 4.0;
            double bayesianAvg = ((reviewCount * averageRating) + (m * c)) / (reviewCount + m);
            double verifiedBonus = Math.min(verifiedCount * 0.05, 0.5);
            return bayesianAvg + verifiedBonus;
        }
    }

    public Map<UUID, ProductMetrics> getAllProductMetrics() {
        Map<UUID, ProductMetrics> metricsMap = new HashMap<>();

        // 1. Fetch Sales Aggregations
        try {
            List<Object[]> salesData = orderRepository.findTopSellingProductIds();
            if (salesData != null) {
                for (Object[] row : salesData) {
                    if (row != null && row.length >= 2 && row[0] instanceof UUID pid && row[1] instanceof Number numSales) {
                        metricsMap.put(pid, ProductMetrics.builder()
                                .productId(pid)
                                .totalUnitsSold(numSales.longValue())
                                .build());
                    }
                }
            }
        } catch (Exception ignored) {}

        // 2. Fetch Published Review Aggregations
        try {
            List<Object[]> reviewData = reviewRepository.findReviewStatsGroupedByProduct(ReviewStatus.PUBLISHED);
            if (reviewData != null) {
                for (Object[] row : reviewData) {
                    if (row != null && row.length >= 3 && row[0] instanceof UUID pid) {
                        double avgRating = row[1] instanceof Number numAvg ? numAvg.doubleValue() : 0.0;
                        long totalRev = row[2] instanceof Number numRev ? numRev.longValue() : 0L;
                        long verRev = row.length >= 4 && row[3] instanceof Number numVer ? numVer.longValue() : 0L;

                        ProductMetrics metrics = metricsMap.computeIfAbsent(pid, id -> ProductMetrics.builder().productId(id).build());
                        metrics.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
                        metrics.setReviewCount(totalRev);
                        metrics.setVerifiedCount(verRev);
                    }
                }
            }
        } catch (Exception ignored) {}

        return metricsMap;
    }

    public List<CatalogDtos.ProductDto> enrichAndRankProducts(List<CatalogDtos.ProductDto> products, String categorySlug, String sortBy) {
        if (products == null || products.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, ProductMetrics> metricsMap = getAllProductMetrics();

        // Determine candidate threshold cutoffs within the active list
        List<ProductMetrics> currentMetrics = products.stream()
                .map(p -> metricsMap.getOrDefault(p.getId(), ProductMetrics.builder().productId(p.getId()).build()))
                .toList();

        long maxSalesInSet = currentMetrics.stream().mapToLong(ProductMetrics::getTotalUnitsSold).max().orElse(0L);
        double maxPopScoreInSet = currentMetrics.stream().mapToDouble(ProductMetrics::getPopularityScore).max().orElse(0.0);

        // Best seller threshold: units sold > 0 and in top tier
        long minSalesForBestSeller = maxSalesInSet > 0 ? Math.max(1L, (long)(maxSalesInSet * 0.4)) : Long.MAX_VALUE;

        // Most popular threshold: review count >= 1 and popularity score in top tier
        double minPopScoreForPopular = maxPopScoreInSet > 0 ? Math.max(3.8, maxPopScoreInSet * 0.8) : Double.MAX_VALUE;

        for (CatalogDtos.ProductDto p : products) {
            ProductMetrics pm = metricsMap.getOrDefault(p.getId(), ProductMetrics.builder().productId(p.getId()).build());

            boolean isBestSeller = pm.getTotalUnitsSold() > 0 && pm.getTotalUnitsSold() >= minSalesForBestSeller;
            boolean isPopular = pm.getReviewCount() >= 1 && pm.getPopularityScore() >= minPopScoreForPopular;

            p.setBestSeller(isBestSeller);
            p.setPopular(isPopular);
            p.setAverageRating(pm.getReviewCount() > 0 ? pm.getAverageRating() : null);
            p.setReviewCount(pm.getReviewCount());
            p.setTotalUnitsSold(pm.getTotalUnitsSold());
        }

        // Apply discovery sorting ONLY if default sort (null/empty/relevance)
        boolean isExplicitSort = sortBy != null && !sortBy.isBlank()
                && !"relevance".equalsIgnoreCase(sortBy)
                && !"default".equalsIgnoreCase(sortBy);

        if (isExplicitSort) {
            return products; // Return explicit caller order with badges attached
        }

        // Smart Discovery Sorting for Default Mode
        return products.stream()
                .sorted((a, b) -> {
                    // 1. In Stock priority
                    boolean aInStock = isProductInStock(a);
                    boolean bInStock = isProductInStock(b);
                    if (aInStock != bInStock) {
                        return Boolean.compare(bInStock, aInStock);
                    }

                    // 2. Dual badge boost (isPopular && isBestSeller)
                    boolean aDual = a.isPopular() && a.isBestSeller();
                    boolean bDual = b.isPopular() && b.isBestSeller();
                    if (aDual != bDual) {
                        return Boolean.compare(bDual, aDual);
                    }

                    // 3. Single badge boost (isPopular || isBestSeller)
                    boolean aBadge = a.isPopular() || a.isBestSeller();
                    boolean bBadge = b.isPopular() || b.isBestSeller();
                    if (aBadge != bBadge) {
                        return Boolean.compare(bBadge, aBadge);
                    }

                    // 4. Combined Discovery Score
                    ProductMetrics ma = metricsMap.getOrDefault(a.getId(), ProductMetrics.builder().build());
                    ProductMetrics mb = metricsMap.getOrDefault(b.getId(), ProductMetrics.builder().build());
                    double scoreA = (ma.getPopularityScore() * 0.6) + (ma.getTotalUnitsSold() * 0.4);
                    double scoreB = (mb.getPopularityScore() * 0.6) + (mb.getTotalUnitsSold() * 0.4);

                    int scoreCompare = Double.compare(scoreB, scoreA);
                    if (scoreCompare != 0) return scoreCompare;

                    // 5. Stable Tie Breaker (Title / ID)
                    return a.getTitle().compareTo(b.getTitle());
                })
                .collect(Collectors.toList());
    }

    public List<CatalogDtos.ProductDto> filterPopularProducts(List<CatalogDtos.ProductDto> enrichedProducts, int limit) {
        return enrichedProducts.stream()
                .filter(CatalogDtos.ProductDto::isPopular)
                .limit(limit > 0 ? limit : 6)
                .collect(Collectors.toList());
    }

    public List<CatalogDtos.ProductDto> filterBestSellingProducts(List<CatalogDtos.ProductDto> enrichedProducts, int limit) {
        return enrichedProducts.stream()
                .filter(CatalogDtos.ProductDto::isBestSeller)
                .limit(limit > 0 ? limit : 6)
                .collect(Collectors.toList());
    }

    private boolean isProductInStock(CatalogDtos.ProductDto p) {
        if (p.getVariants() == null || p.getVariants().isEmpty()) return false;
        return p.getVariants().stream().anyMatch(v -> v.isActive() && v.getStockQuantity() > 0);
    }
}
