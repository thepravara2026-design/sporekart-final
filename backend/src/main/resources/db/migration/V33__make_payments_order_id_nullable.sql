-- Sporekart Database Migration V33: Make payments order_id and razorpay_order_id nullable for non-order payments (e.g. training enrollments, wallet topups)

ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN razorpay_order_id DROP NOT NULL;
