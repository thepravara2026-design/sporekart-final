-- Sporekart Database Migration V37: Ensure single active cart per user and add unique constraint

-- 1. Deduplicate any existing duplicate active carts for users (keep newest updated, convert older)
WITH ranked_carts AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as rn
    FROM carts
    WHERE user_id IS NOT NULL AND status = 'ACTIVE'
)
UPDATE carts
SET status = 'CONVERTED'
WHERE id IN (
    SELECT id FROM ranked_carts WHERE rn > 1
);

-- 2. Create partial unique index on active cart per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_active
ON carts (user_id)
WHERE user_id IS NOT NULL AND status = 'ACTIVE';
