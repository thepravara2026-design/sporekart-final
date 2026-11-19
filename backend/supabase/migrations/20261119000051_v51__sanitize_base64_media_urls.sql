-- Sporekart Database Migration V51: Sanitize and guard against raw base64 data URLs in media and categories
-- Prevents socket aborts, buffer exhaustion, and egress quota overages from multi-megabyte Data URIs.

-- 1. Sanitize legacy product_media containing raw base64 data URIs
UPDATE product_media
SET media_url = 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80'
WHERE media_url LIKE 'data:image%';

-- 2. Sanitize legacy categories containing raw base64 data URIs
UPDATE categories
SET image_url = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
WHERE image_url LIKE 'data:image%';

-- 3. Enforce CHECK constraints preventing future raw base64 data URIs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_media_no_base64'
    ) THEN
        ALTER TABLE product_media
        ADD CONSTRAINT chk_product_media_no_base64
        CHECK (media_url NOT LIKE 'data:image%');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_categories_no_base64'
    ) THEN
        ALTER TABLE categories
        ADD CONSTRAINT chk_categories_no_base64
        CHECK (image_url IS NULL OR image_url NOT LIKE 'data:image%');
    END IF;
END $$;
