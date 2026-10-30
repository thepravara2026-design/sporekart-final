-- Sporekart Database Migration V45: Add missing foreign key indexes, composite query indexes, and search tuning
-- Bounded Contexts: Catalog, Training, Cart, Content

-- 1. Unindexed Foreign Keys (prevents full table scan on cascade / joins)
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- 2. Training Masterclass Composite Query Indexes
CREATE INDEX IF NOT EXISTS idx_batches_course_status ON batches(course_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_status_start_date ON batches(status, start_date ASC);
CREATE INDEX IF NOT EXISTS idx_courses_category_active ON courses(category_id, is_active);

-- 3. Catalog & Content High-Speed Composite Indexes
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);

-- 4. Trigram Extension and GIN Index for Catalog & Masterclass Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops);
