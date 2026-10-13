-- Sporekart Database Migration V34: Performance Tuning & Secondary Composite Indexes

CREATE INDEX IF NOT EXISTS idx_products_type_category_active ON products(product_type, category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_created ON enrollments(user_id, enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
