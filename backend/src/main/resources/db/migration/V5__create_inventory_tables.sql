-- Sporekart Migration V5: Independent Inventory Management

-- 1. Inventory Records Table
CREATE TABLE IF NOT EXISTS inventory_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    sold_quantity INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_available_non_negative CHECK (available_quantity >= 0),
    CONSTRAINT chk_reserved_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_sold_non_negative CHECK (sold_quantity >= 0)
);

-- 2. Inventory Audit Events Table
CREATE TABLE IF NOT EXISTS inventory_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- INITIALIZED, RESERVED, RELEASED, CONFIRMED_SOLD, CANCELLED_RESTOCKED, ADJUSTED
    quantity_changed INT NOT NULL,
    available_quantity_after INT NOT NULL,
    reserved_quantity_after INT NOT NULL,
    sold_quantity_after INT NOT NULL,
    reference_id VARCHAR(100), -- Order ID / Reservation Token / Reason Reference
    reason VARCHAR(255),
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_records_variant_id ON inventory_records(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_events_variant_id ON inventory_audit_events(variant_id);
