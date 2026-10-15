-- Sporekart Database Migration V38: Create wallet_topup_intents table
-- Secures wallet top-up lifecycle and eliminates client-controlled amount injection

CREATE TABLE IF NOT EXISTS wallet_topup_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    transaction_reference VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    razorpay_payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wallet_topup_intents_user ON wallet_topup_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_intents_rzp_order ON wallet_topup_intents(razorpay_order_id);
