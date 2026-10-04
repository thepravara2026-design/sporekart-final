package com.sporekart.promotion.domain;

public enum PromotionTargetAudience {
    CUSTOMER,  // Valid only for product store purchases / cart checkout
    TRAINEE,   // Valid only for training course & batch enrollments
    BOTH       // Universal promo valid for both product purchases and training enrollments
}
