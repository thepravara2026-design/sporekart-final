
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL_SUPPORT',
    order_id UUID,
    payment_id UUID,
    shipment_id UUID,
    course_id UUID,
    product_id UUID,
    satisfaction_rating INT,
    satisfaction_feedback TEXT,
    closed_by VARCHAR(100),
    closed_at TIMESTAMP WITH TIME ZONE,
    is_auto_replied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sporekart Database Migration V14: Comprehensive Support Module Tables

ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'GENERAL_SUPPORT',
ADD COLUMN IF NOT EXISTS order_id UUID,
ADD COLUMN IF NOT EXISTS payment_id UUID,
ADD COLUMN IF NOT EXISTS shipment_id UUID,
ADD COLUMN IF NOT EXISTS course_id UUID,
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID,
    sender_type VARCHAR(50) NOT NULL, -- CUSTOMER, SUPPORT_AGENT, ADMIN, SYSTEM
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
