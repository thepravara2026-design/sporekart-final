-- Flyway Migration V21: Add secondary indexes for orders, variants, and OTP lookup performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_otps_identifier_type ON otps (identifier, otp_type, consumed);
