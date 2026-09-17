package com.sporekart.catalog.application;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductOffer;
import com.sporekart.catalog.domain.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PricingService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceCalculationResult {
        private BigDecimal basePriceInr;
        private BigDecimal compareAtPriceInr;
        private BigDecimal discountAmountInr;
        private BigDecimal netPriceInr;
        private BigDecimal gstRatePercent;
        private BigDecimal gstAmountInr;
        private BigDecimal finalPriceInr;
        private String appliedOfferName;
    }

    public PriceCalculationResult calculatePrice(Product product, ProductVariant variant) {
        BigDecimal basePrice = variant.getPriceInr() != null ? variant.getPriceInr() : BigDecimal.ZERO;
        BigDecimal compareAtPrice = variant.getCompareAtPriceInr();
        BigDecimal discount = BigDecimal.ZERO;
        String appliedOfferName = null;

        // Check active offers on product or specific variant
        List<ProductOffer> offers = product.getOffers();
        if (offers != null && !offers.isEmpty()) {
            for (ProductOffer offer : offers) {
                if (offer.isCurrentlyValid()) {
                    if (offer.getVariantId() == null || offer.getVariantId().equals(variant.getId())) {
                        appliedOfferName = offer.getOfferName();
                        if (offer.getDiscountAmountInr() != null && offer.getDiscountAmountInr().compareTo(BigDecimal.ZERO) > 0) {
                            discount = discount.add(offer.getDiscountAmountInr());
                        }
                        if (offer.getDiscountPercent() != null && offer.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal percentDiscount = basePrice.multiply(offer.getDiscountPercent())
                                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                            discount = discount.add(percentDiscount);
                        }
                        break; // Apply best matching offer
                    }
                }
            }
        }

        BigDecimal netPrice = basePrice.subtract(discount);
        if (netPrice.compareTo(BigDecimal.ZERO) < 0) {
            netPrice = BigDecimal.ZERO;
        }

        BigDecimal gstRate = product.getGstRatePercent() != null ? product.getGstRatePercent() : BigDecimal.ZERO;
        BigDecimal gstAmount = netPrice.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal finalPrice = netPrice.add(gstAmount);

        return PriceCalculationResult.builder()
                .basePriceInr(basePrice)
                .compareAtPriceInr(compareAtPrice)
                .discountAmountInr(discount)
                .netPriceInr(netPrice)
                .gstRatePercent(gstRate)
                .gstAmountInr(gstAmount)
                .finalPriceInr(finalPrice)
                .appliedOfferName(appliedOfferName)
                .build();
    }
}
