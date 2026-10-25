-- V41: Formally retire wallet operations and preserve historical audit records
-- In accordance with Sporekart Production-Grade Razorpay Payment & Financial Architecture:
-- 1. All wallet top-ups, withdrawals, transfers, and checkout deductions are retired.
-- 2. Existing wallet tables (wallets, wallet_transactions, wallet_withdrawals, wallet_topup_intents)
--    are preserved as immutable historical financial audit records. No historical data is deleted.
-- 3. All future customer payments and refunds are processed exclusively through Razorpay Gateway.

COMMENT ON TABLE wallets IS 'ARCHIVED: Historical wallet records preserved for financial audit and compliance. Active wallet operations are retired.';
COMMENT ON TABLE wallet_transactions IS 'ARCHIVED: Historical financial ledger of past wallet transactions. Preserved for accounting audit.';
COMMENT ON TABLE wallet_withdrawals IS 'ARCHIVED: Historical record of past bank withdrawals. New withdrawal requests are permanently disabled.';
COMMENT ON TABLE wallet_topup_intents IS 'ARCHIVED: Historical record of topup payment attempts. New topups are permanently disabled.';

-- Add index to facilitate fast audit reporting on historical records
CREATE INDEX IF NOT EXISTS idx_wallet_txns_audit ON wallet_transactions(created_at, wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_audit ON wallet_withdrawals(created_at, status);
