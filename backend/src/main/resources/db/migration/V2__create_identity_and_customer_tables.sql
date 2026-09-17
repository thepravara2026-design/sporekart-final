-- Sporekart Migration V2: Identity & Customer Bounded Context Enhancements

-- 1. Extend Users table for Customer Profile immutability & identity rules
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Customer Identity Providers Table (Multi-provider linking: Google OAuth, Phone OTP, Email OTP)
CREATE TABLE IF NOT EXISTS customer_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- GOOGLE, PHONE_OTP, EMAIL_OTP
    provider_subject VARCHAR(255) NOT NULL, -- e.g., google_sub, phone_number, email_address
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_provider_subject UNIQUE (provider, provider_subject)
);

-- 3. Customer Addresses Table (Separate entity for address book)
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Extend OTPs Table for Security Controls (Attempt limits, expiration, replay protection)
ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS consumed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS otp_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER_AUTH'; -- CUSTOMER_AUTH, ADMIN_AUTH, EMAIL_CHANGE

CREATE INDEX IF NOT EXISTS idx_customer_identities_user_id ON customer_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_identifier_type ON otps(identifier, otp_type);
