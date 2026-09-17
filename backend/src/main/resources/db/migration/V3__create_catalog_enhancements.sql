-- Sporekart Migration V3: Catalog Bounded Context Enhancements

-- 1. Extend Categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Extend Products table for Status, HSN/GST, and SEO Meta
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'; -- DRAFT, ACTIVE, ARCHIVED
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- 3. Extend Product Variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Product Offers Table
CREATE TABLE IF NOT EXISTS product_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    offer_name VARCHAR(150) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount_inr NUMERIC(10, 2) DEFAULT 0.00,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Product Media Table (Replaces flat image fields with structured media relationships)
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE', -- IMAGE, VIDEO
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status, is_active);
