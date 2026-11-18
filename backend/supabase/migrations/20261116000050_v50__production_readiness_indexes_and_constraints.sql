-- Sporekart Database Migration V50: Production Readiness Partial Indexes, Constraints and Audit Safety
-- Ensures financial record immutability, index parity on Razorpay order lookups, and display stock validation.

-- 1. Deduplicate corrupt legacy orders with duplicate razorpay_order_id and add partial unique index
WITH ranked_orders AS (
    SELECT id, razorpay_order_id,
           ROW_NUMBER() OVER (PARTITION BY razorpay_order_id ORDER BY updated_at DESC, created_at DESC) as rn
    FROM orders
    WHERE razorpay_order_id IS NOT NULL
)
UPDATE orders
SET razorpay_order_id = NULL
WHERE id IN (
    SELECT id FROM ranked_orders WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_order_id
ON orders (razorpay_order_id)
WHERE razorpay_order_id IS NOT NULL;

-- 2. Deduplicate duplicate captured payments per order and add partial unique index
WITH ranked_payments AS (
    SELECT id, order_id,
           ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) as rn
    FROM payments
    WHERE order_id IS NOT NULL AND status = 'CAPTURED'
)
UPDATE payments
SET status = 'FAILED'
WHERE id IN (
    SELECT id FROM ranked_payments WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_order_captured
ON payments (order_id)
WHERE order_id IS NOT NULL AND status = 'CAPTURED';

-- 3. Clamp negative stock to 0 and add CHECK constraint on product_variants.stock_quantity
UPDATE product_variants SET stock_quantity = 0 WHERE stock_quantity < 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_stock_quantity_non_negative'
    ) THEN
        ALTER TABLE product_variants
        ADD CONSTRAINT chk_product_variants_stock_quantity_non_negative
        CHECK (stock_quantity >= 0);
    END IF;
END $$;

-- 4. Audit Protection: Ensure orders cannot be hard-deleted if financial payments exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_order_id_fkey' AND table_name = 'payments'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT payments_order_id_fkey;
        ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 5. Outbox Stuck Recovery Index: Accelerate polling for stuck PROCESSING notifications
CREATE INDEX IF NOT EXISTS idx_notification_events_stuck_recovery 
ON notification_events(status, last_attempt_at);
