-- Sporekart Database Migration V36: Package Weights, Dimensions, and Shipment Uniqueness

-- 1. Add Weight and Dimensions to Product Variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6, 3) NOT NULL DEFAULT 0.250;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS length_cm NUMERIC(6, 2) NOT NULL DEFAULT 15.00;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS breadth_cm NUMERIC(6, 2) NOT NULL DEFAULT 15.00;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6, 2) NOT NULL DEFAULT 10.00;

-- 2. Add Unique Constraint on Shipments (order_id) to prevent duplicate concurrent shipments
ALTER TABLE shipments ADD CONSTRAINT uq_shipments_order_id UNIQUE (order_id);
