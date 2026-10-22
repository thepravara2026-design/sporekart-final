-- V39: Reconcile Batch Enrolled Counts, Clean Up Legacy Tables, and Add Missing Foreign Key Indexes
-- Fixes FINDING-DB-01, FINDING-DB-02, and FINDING-DB-03

-- 1. Drop unused empty legacy tables from V1
DROP TABLE IF EXISTS training_bookings CASCADE;
DROP TABLE IF EXISTS training_slots CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;

-- 2. Reconcile batches.enrolled_count with active confirmed/completed enrollments
UPDATE batches b
SET enrolled_count = COALESCE(sub.cnt, 0)
FROM (
    SELECT batch_id, COUNT(*) AS cnt
    FROM enrollments
    WHERE status IN ('CONFIRMED', 'COMPLETED')
    GROUP BY batch_id
) sub
WHERE b.id = sub.batch_id;

-- 3. Add supporting indexes on high-frequency join foreign keys (Supabase Best Practice: schema-foreign-key-indexes)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendances_enrollment_id ON attendances(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_order_id ON promotion_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_variant_id ON product_reviews(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_moderated_by ON product_reviews(moderated_by);
CREATE INDEX IF NOT EXISTS idx_review_invitation_order_id ON review_invitation_states(order_id);
CREATE INDEX IF NOT EXISTS idx_training_reviews_batch_id ON training_reviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_training_reviews_moderated_by ON training_reviews(moderated_by);
CREATE INDEX IF NOT EXISTS idx_product_offers_variant_id ON product_offers(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_media_variant_id ON product_media(variant_id);
CREATE INDEX IF NOT EXISTS idx_media_product_links_media_id ON media_product_links(media_id);
CREATE INDEX IF NOT EXISTS idx_media_product_links_variant_id ON media_product_links(variant_id);
CREATE INDEX IF NOT EXISTS idx_media_course_links_media_id ON media_course_links(media_id);
