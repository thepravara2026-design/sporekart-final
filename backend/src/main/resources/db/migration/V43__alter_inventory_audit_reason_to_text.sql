-- Sporekart Migration V43: Alter inventory_audit_events reason column to TEXT
-- Prevents SQLState 22001 (value too long for type character varying(255))
-- when detailed customer or admin cancellation reasons are recorded.

ALTER TABLE inventory_audit_events ALTER COLUMN reason TYPE TEXT;
