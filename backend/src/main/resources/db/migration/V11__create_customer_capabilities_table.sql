-- V11: Create Customer Capabilities Table & Backfill Default Capabilities

CREATE TABLE IF NOT EXISTS customer_capabilities (
    customer_profile_id UUID NOT NULL,
    capability VARCHAR(50) NOT NULL,
    CONSTRAINT pk_customer_capabilities PRIMARY KEY (customer_profile_id, capability),
    CONSTRAINT fk_customer_capabilities_profile FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_capabilities_profile ON customer_capabilities(customer_profile_id);

-- Backfill default capabilities (SHOP, ORDER, SUPPORT) for all existing customer profiles
INSERT INTO customer_capabilities (customer_profile_id, capability)
SELECT id, 'SHOP' FROM customer_profiles
ON CONFLICT DO NOTHING;

INSERT INTO customer_capabilities (customer_profile_id, capability)
SELECT id, 'ORDER' FROM customer_profiles
ON CONFLICT DO NOTHING;

INSERT INTO customer_capabilities (customer_profile_id, capability)
SELECT id, 'SUPPORT' FROM customer_profiles
ON CONFLICT DO NOTHING;

-- Backfill TRAINING capability for profiles where has_training_capability is true
INSERT INTO customer_capabilities (customer_profile_id, capability)
SELECT id, 'TRAINING' FROM customer_profiles WHERE has_training_capability = TRUE
ON CONFLICT DO NOTHING;
