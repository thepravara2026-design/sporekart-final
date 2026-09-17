-- Sporekart Database Migration V7: Order & Checkout Bounded Context Enhancements

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_total_amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_total_amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total_inr NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_state VARCHAR(50),
    new_state VARCHAR(50) NOT NULL,
    reason TEXT,
    created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
