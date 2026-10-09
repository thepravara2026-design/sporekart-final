-- Migration V32: Add Database-Level Non-Negative Balance Check Constraint on Wallets

ALTER TABLE wallets
    ADD CONSTRAINT check_wallet_available_balance_non_negative CHECK (available_balance >= 0.00);
