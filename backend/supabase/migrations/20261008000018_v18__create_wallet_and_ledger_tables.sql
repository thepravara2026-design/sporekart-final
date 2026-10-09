-- Sporekart Migration V18: Wallet, Payment Ledger, Refund & Settlement System

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    user_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    withdrawable_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID,
    user_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    transaction_type VARCHAR(50) NOT NULL,
    transaction_direction VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    order_id UUID,
    payment_id UUID,
    refund_id VARCHAR(255),
    enrollment_id UUID,
    training_batch_id UUID,
    withdrawal_id UUID,
    parent_transaction_id UUID,
    related_transaction_id UUID,
    description TEXT,
    metadata_json TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_reference VARCHAR(100) NOT NULL UNIQUE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    bank_name VARCHAR(150),
    account_number_masked VARCHAR(50),
    ifsc_code VARCHAR(30),
    account_holder_name VARCHAR(150),
    admin_notes TEXT,
    rejection_reason TEXT,
    processed_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_order_id ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_enrollment_id ON wallet_transactions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_wallet_id ON wallet_withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_id ON wallet_withdrawals(user_id);
