-- Sporekart Database Migration V15: Analytics Event Log Table

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL, -- ProductViewed, AddToCart, CheckoutStarted, OrderCreated, PaymentCaptured, OrderDelivered, EnrollmentCreated, EnrollmentConfirmed
    metric_value NUMERIC(12, 2) DEFAULT 1.0,
    user_id UUID,
    reference_id VARCHAR(255),
    event_data_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
