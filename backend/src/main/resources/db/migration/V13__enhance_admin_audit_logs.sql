-- Sporekart Database Migration V13: Enhance Admin Audit Logs

ALTER TABLE admin_audit_logs 
ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS resource_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS old_value TEXT,
ADD COLUMN IF NOT EXISTS new_value TEXT,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
