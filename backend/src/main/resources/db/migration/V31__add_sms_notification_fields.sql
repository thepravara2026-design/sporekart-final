-- Flyway Migration V31: Add SMS and Twilio tracking fields to notification_events table

ALTER TABLE notification_events
    ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(64),
    ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(32) DEFAULT 'EMAIL_AND_SMS',
    ADD COLUMN IF NOT EXISTS sms_status VARCHAR(32) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sms_failed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sms_error_message TEXT,
    ADD COLUMN IF NOT EXISTS sms_provider VARCHAR(32) DEFAULT 'TWILIO',
    ADD COLUMN IF NOT EXISTS sms_provider_message_id VARCHAR(255);

ALTER TABLE notification_events ALTER COLUMN recipient_email DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_events_recipient_phone ON notification_events(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_notification_events_sms_status ON notification_events(sms_status);
