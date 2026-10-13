-- Sporekart Database Migration V22: Add Batch and Course Promotion Targets

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_batch_id UUID;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_course_id UUID;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'ALL';

CREATE INDEX IF NOT EXISTS idx_promotions_target_batch ON promotions(target_batch_id);
CREATE INDEX IF NOT EXISTS idx_promotions_target_course ON promotions(target_course_id);

-- Seed initial batch promotion code
INSERT INTO promotions (id, name, code, description, type, discount_value, maximum_discount, minimum_order_value, status, usage_limit, per_customer_limit, priority, target_type)
VALUES 
    (gen_random_uuid(), 'Mushroom Cultivation 10% Off', 'MUSHROOM10', '10% discount on mushroom cultivation masterclass batches', 'PERCENTAGE', 10.00, 500.00, 0.00, 'ACTIVE', 500, 3, 10, 'BATCH')
ON CONFLICT (code) DO NOTHING;
