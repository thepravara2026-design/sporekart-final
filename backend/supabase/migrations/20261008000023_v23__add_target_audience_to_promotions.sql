-- Sporekart Database Migration V23: Add Target Audience (Applicability) to Promotions

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'BOTH';

CREATE INDEX IF NOT EXISTS idx_promotions_target_audience ON promotions(target_audience);

-- Update default sample promotions to appropriate target audiences
UPDATE promotions SET target_audience = 'CUSTOMER' WHERE code IN ('SPORE10', 'WELCOME50', 'FREESHIP', 'FUNGI20');
UPDATE promotions SET target_audience = 'TRAINEE' WHERE code IN ('MUSHROOM10', 'BATCH20');
