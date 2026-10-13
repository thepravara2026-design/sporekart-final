-- Sporekart Database Migration V20: Promotions & Cart Promo Code Support

-- 1. Add applied_promo_code column to carts table
ALTER TABLE carts ADD COLUMN IF NOT EXISTS applied_promo_code VARCHAR(100);

-- 2. Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
    discount_value NUMERIC(12, 2),
    maximum_discount NUMERIC(12, 2),
    minimum_order_value NUMERIC(12, 2),
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED
    usage_limit INT,
    per_customer_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    stackable BOOLEAN NOT NULL DEFAULT FALSE,
    priority INT NOT NULL DEFAULT 0,
    target_category_slug VARCHAR(255),
    target_product_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create promotion_usages table
CREATE TABLE IF NOT EXISTS promotion_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount_inr NUMERIC(12, 2),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_promo_user ON promotion_usages(promotion_id, user_id);

-- 4. Seed initial active promo codes
INSERT INTO promotions (id, name, code, description, type, discount_value, maximum_discount, minimum_order_value, status, usage_limit, per_customer_limit, priority)
VALUES 
    (gen_random_uuid(), 'Sporekart 10% Special', 'SPORE10', 'Get 10% OFF on gourmet mushrooms & spawn bags (Min Order ₹299)', 'PERCENTAGE', 10.00, 200.00, 299.00, 'ACTIVE', 1000, 5, 10),
    (gen_random_uuid(), 'Welcome ₹50 Discount', 'WELCOME50', 'Flat ₹50 OFF for all new growers (Min Order ₹199)', 'FIXED_AMOUNT', 50.00, 50.00, 199.00, 'ACTIVE', 500, 1, 5),
    (gen_random_uuid(), 'Free Cold-Chain Shipping', 'FREESHIP', 'Free refrigerated cold-chain delivery on any order', 'FREE_SHIPPING', 0.00, NULL, 0.00, 'ACTIVE', 2000, 10, 8),
    (gen_random_uuid(), 'Fungi Super 20% Discount', 'FUNGI20', 'Get 20% OFF on orders over ₹499 (Max discount ₹500)', 'PERCENTAGE', 20.00, 500.00, 499.00, 'ACTIVE', 500, 2, 12)
ON CONFLICT (code) DO NOTHING;
