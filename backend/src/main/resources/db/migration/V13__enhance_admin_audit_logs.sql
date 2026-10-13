
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sporekart Database Migration V13: Enhance Admin Audit Logs

ALTER TABLE admin_audit_logs 
ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS resource_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS old_value TEXT,
ADD COLUMN IF NOT EXISTS new_value TEXT,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
