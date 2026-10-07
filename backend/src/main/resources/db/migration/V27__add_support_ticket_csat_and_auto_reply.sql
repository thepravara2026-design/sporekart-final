-- Sporekart Database Migration V27: Add CSAT Review Rating and Auto-Reply Guardrails to Support Tickets

ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER,
ADD COLUMN IF NOT EXISTS satisfaction_feedback TEXT,
ADD COLUMN IF NOT EXISTS closed_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_auto_replied BOOLEAN DEFAULT FALSE;

-- Index for CSAT analytics queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_csat ON support_tickets (satisfaction_rating) WHERE satisfaction_rating IS NOT NULL;
