-- V49: Add composite unique index on active enrollments to prevent duplicate user enrollments per batch
CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollments_user_batch 
ON enrollments (user_id, batch_id) 
WHERE status != 'CANCELLED';

