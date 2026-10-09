-- V19: Add Shipment Tracking URL and Courier Fields to Orders & Shipments

ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_partner VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500);
