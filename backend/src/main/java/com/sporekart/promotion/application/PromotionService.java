package com.sporekart.promotion.application;

import com.sporekart.promotion.api.PromotionDtos;
import com.sporekart.promotion.domain.*;
import com.sporekart.promotion.infrastructure.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;

    @Transactional
    public Promotion createPromotion(PromotionDtos.CreatePromotionRequest req) {
        String cleanCode = req.getCode().trim().toUpperCase();
        if (promotionRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new IllegalArgumentException("Promo code already exists: " + cleanCode);
        }

        Promotion promotion = Promotion.builder()
                .name(req.getName().trim())
                .code(cleanCode)
                .description(req.getDescription())
                .type(req.getType())
                .discountValue(req.getDiscountValue() != null ? req.getDiscountValue() : BigDecimal.ZERO)
                .maximumDiscount(req.getMaximumDiscount())
                .minimumOrderValue(req.getMinimumOrderValue())
                .startAt(req.getStartAt())
                .endAt(req.getEndAt())
                .status(req.getStatus() != null ? req.getStatus() : PromotionStatus.ACTIVE)
                .usageLimit(req.getUsageLimit())
                .perCustomerLimit(req.getPerCustomerLimit())
                .usageCount(0)
                .stackable(req.getStackable() != null ? req.getStackable() : false)
                .priority(req.getPriority() != null ? req.getPriority() : 0)
                .targetCategorySlug(req.getTargetCategorySlug())
                .targetProductId(req.getTargetProductId())
                .build();

        return promotionRepository.save(promotion);
    }

    @Transactional
    public Promotion updatePromotion(UUID id, PromotionDtos.CreatePromotionRequest req) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + id));

        String cleanCode = req.getCode().trim().toUpperCase();
        if (!promotion.getCode().equalsIgnoreCase(cleanCode) && promotionRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new IllegalArgumentException("Promo code already exists: " + cleanCode);
        }

        promotion.setName(req.getName().trim());
        promotion.setCode(cleanCode);
        promotion.setDescription(req.getDescription());
        promotion.setType(req.getType());
        if (req.getDiscountValue() != null) promotion.setDiscountValue(req.getDiscountValue());
        promotion.setMaximumDiscount(req.getMaximumDiscount());
        promotion.setMinimumOrderValue(req.getMinimumOrderValue());
        promotion.setStartAt(req.getStartAt());
        promotion.setEndAt(req.getEndAt());
        if (req.getStatus() != null) promotion.setStatus(req.getStatus());
        promotion.setUsageLimit(req.getUsageLimit());
        promotion.setPerCustomerLimit(req.getPerCustomerLimit());
        if (req.getStackable() != null) promotion.setStackable(req.getStackable());
        if (req.getPriority() != null) promotion.setPriority(req.getPriority());
        promotion.setTargetCategorySlug(req.getTargetCategorySlug());
        promotion.setTargetProductId(req.getTargetProductId());

        return promotionRepository.save(promotion);
    }

    @Transactional
    public Promotion toggleStatus(UUID id, PromotionStatus status) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + id));
        promotion.setStatus(status);
        return promotionRepository.save(promotion);
    }

    @Transactional
    public void deletePromotion(UUID id) {
        promotionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<Promotion> getAllPromotions(PromotionStatus status, String query, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        return promotionRepository.searchPromotions(status, query, PageRequest.of(page, size, sort));
    }

    @Transactional(readOnly = true)
    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByStatus(PromotionStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Optional<Promotion> findByCode(String code) {
        if (code == null || code.trim().isEmpty()) return Optional.empty();
        return promotionRepository.findByCodeIgnoreCase(code.trim());
    }

    @Data
    @Builder
    public static class CartItemContext {
        private UUID productId;
        private String categorySlug;
        private BigDecimal lineTotalInr;
    }

    @Transactional(readOnly = true)
    public PromotionDtos.PromotionValidationResult validateAndCalculate(
            String code,
            UUID userId,
            String sessionId,
            BigDecimal cartSubtotal,
            List<CartItemContext> items
    ) {
        if (code == null || code.trim().isEmpty()) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .message("No promo code provided")
                    .build();
        }

        Optional<Promotion> promoOpt = promotionRepository.findByCodeIgnoreCase(code.trim());
        if (promoOpt.isEmpty()) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(code)
                    .message("This promo code is invalid")
                    .build();
        }

        Promotion promo = promoOpt.get();

        if (promo.getStatus() != PromotionStatus.ACTIVE) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("This promo code is currently " + promo.getStatus().name().toLowerCase())
                    .build();
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (promo.getStartAt() != null && now.isBefore(promo.getStartAt())) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("This offer is not active yet")
                    .build();
        }

        if (promo.getEndAt() != null && now.isAfter(promo.getEndAt())) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("This promo code has expired")
                    .build();
        }

        if (promo.getUsageLimit() != null && promo.getUsageCount() >= promo.getUsageLimit()) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("Usage limit reached for this promo code")
                    .build();
        }

        if (userId != null && promo.getPerCustomerLimit() != null) {
            long userUsageCount = promotionUsageRepository.countByPromotionIdAndUserId(promo.getId(), userId);
            if (userUsageCount >= promo.getPerCustomerLimit()) {
                return PromotionDtos.PromotionValidationResult.builder()
                        .valid(false)
                        .code(promo.getCode())
                        .name(promo.getName())
                        .message("You have already used this promo code")
                        .build();
            }
        }

        if (promo.getMinimumOrderValue() != null && cartSubtotal.compareTo(promo.getMinimumOrderValue()) < 0) {
            BigDecimal diff = promo.getMinimumOrderValue().subtract(cartSubtotal);
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("Add ₹" + diff.setScale(2, RoundingMode.HALF_UP) + " more to apply offer '" + promo.getCode() + "'")
                    .build();
        }

        BigDecimal eligibleSubtotal = cartSubtotal;
        if (items != null && !items.isEmpty()) {
            if (promo.getTargetCategorySlug() != null && !promo.getTargetCategorySlug().isBlank()) {
                eligibleSubtotal = items.stream()
                        .filter(i -> promo.getTargetCategorySlug().equalsIgnoreCase(i.getCategorySlug()))
                        .map(CartItemContext::getLineTotalInr)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            } else if (promo.getTargetProductId() != null) {
                eligibleSubtotal = items.stream()
                        .filter(i -> promo.getTargetProductId().equals(i.getProductId()))
                        .map(CartItemContext::getLineTotalInr)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        if (eligibleSubtotal.compareTo(BigDecimal.ZERO) <= 0 && promo.getType() != PromotionType.FREE_SHIPPING) {
            return PromotionDtos.PromotionValidationResult.builder()
                    .valid(false)
                    .code(promo.getCode())
                    .name(promo.getName())
                    .message("This promo code is not applicable to any items in your cart")
                    .build();
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        boolean isFreeShipping = promo.getType() == PromotionType.FREE_SHIPPING;

        if (promo.getType() == PromotionType.PERCENTAGE) {
            BigDecimal percent = promo.getDiscountValue().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            discountAmount = eligibleSubtotal.multiply(percent).setScale(2, RoundingMode.HALF_UP);
            if (promo.getMaximumDiscount() != null && discountAmount.compareTo(promo.getMaximumDiscount()) > 0) {
                discountAmount = promo.getMaximumDiscount();
            }
        } else if (promo.getType() == PromotionType.FIXED_AMOUNT) {
            discountAmount = promo.getDiscountValue().min(eligibleSubtotal).setScale(2, RoundingMode.HALF_UP);
        }

        return PromotionDtos.PromotionValidationResult.builder()
                .valid(true)
                .code(promo.getCode())
                .name(promo.getName())
                .type(promo.getType())
                .discountAmountInr(discountAmount)
                .isFreeShipping(isFreeShipping)
                .message("Offer '" + promo.getCode() + "' applied successfully!")
                .build();
    }

    @Transactional
    public void recordUsage(UUID promotionId, UUID userId, String sessionId, UUID orderId, BigDecimal discountAmount) {
        Promotion promo = promotionRepository.findById(promotionId).orElse(null);
        if (promo != null) {
            promo.setUsageCount(promo.getUsageCount() + 1);
            promotionRepository.save(promo);

            PromotionUsage usage = PromotionUsage.builder()
                    .promotionId(promotionId)
                    .userId(userId)
                    .sessionId(sessionId)
                    .orderId(orderId)
                    .discountAmountInr(discountAmount)
                    .build();
            promotionUsageRepository.save(usage);
        }
    }
}
