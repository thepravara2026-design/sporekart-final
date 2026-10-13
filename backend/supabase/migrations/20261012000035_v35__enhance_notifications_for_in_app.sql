-- Flyway Migration V35: Enhance Notification Events for In-App Notification Center
ALTER TABLE notification_events 
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'ROLE_CUSTOMER',
    ADD COLUMN IF NOT EXISTS is_admin_notification BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite indexes for high-speed badge counters and feed queries
CREATE INDEX IF NOT EXISTS idx_notification_events_in_app_feed 
    ON notification_events(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_admin_in_app 
    ON notification_events(is_admin_notification, is_read, created_at DESC);
