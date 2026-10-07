-- Add alternate_phone column to customer_addresses table for delivery contact separation
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);
