-- V30: Relax legacy constraints on courses table from V1 placeholder schema

ALTER TABLE courses ALTER COLUMN category DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN mode DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN price_inr DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN duration_hours DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN description DROP NOT NULL;
