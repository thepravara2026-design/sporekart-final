-- Sporekart Database Migration V42: Add composite index for orders status and created_at
-- Optimizes order history queries, admin dashboard filters, and pending payment reconciliation sweeps

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
