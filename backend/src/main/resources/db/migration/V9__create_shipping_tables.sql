
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS awb_code VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS courier_id VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_address_json TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- V9: Create Shipping Module Tables

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    shipment_id VARCHAR(100),
    awb_code VARCHAR(100),
    courier_name VARCHAR(100),
    courier_id VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    shipping_address_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipments_order_id FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb_code ON shipments(awb_code);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_id ON shipments(shipment_id);

CREATE TABLE IF NOT EXISTS shipment_trackings (
    id UUID PRIMARY KEY,
    shipment_id UUID NOT NULL,
    awb_code VARCHAR(100),
    current_status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    activity VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE,
    event_data_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipment_trackings_shipment_id FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shipment_trackings_shipment_id ON shipment_trackings(shipment_id);
