-- Flyway Migration V28: Create Notification Events Outbox & Tracking Table
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    template_key VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    payload_json TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    provider VARCHAR(32) DEFAULT 'GMAIL',
    provider_message_id VARCHAR(255),
    deduplication_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_events_status ON notification_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_events_user ON notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_dedup ON notification_events(deduplication_key);
