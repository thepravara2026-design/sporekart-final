-- Sporekart Database Migration V44: Cleanup Legacy Orphaned Payments
-- EC-20 Remediation: Purges legacy mock test payments where order_id is NULL or references non-existent orders

DELETE FROM payments 
WHERE order_id IS NULL 
   OR order_id NOT IN (SELECT id FROM orders);
