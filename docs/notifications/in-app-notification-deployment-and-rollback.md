# SPOREKART IN-APP NOTIFICATION DEPLOYMENT & ROLLBACK GUIDE
**Document ID:** `DOC-NOTIF-006`  
**Status:** SPECIFICATION  
**Author:** DevOps & Database Administrator  
**Date:** October 12, 2026  

---

## 1. MIGRATION & DEPLOYMENT STRATEGY

### 1.1 Zero-Downtime Migration Design
The proposed database migration (`V35__enhance_notifications_for_in_app.sql`) is 100% additive and safe for online execution:
- Uses `ADD COLUMN IF NOT EXISTS` for all newly introduced columns.
- Provides default values (`is_read = FALSE`, `is_admin_notification = FALSE`, `category = 'GENERAL'`), preventing lock contention or table rewrites on existing rows.
- Uses `CREATE INDEX IF NOT EXISTS` for performance indexes.
- No existing columns, constraints, or foreign keys are altered or dropped.

### 1.2 Execution Order
1. Apply Flyway migration `V35` during standard application bootstrap or deployment step.
2. Deploy backend service container with updated entity mappings and controllers.
3. Deploy frontend bundle containing `NotificationCenter` and `Navbar` updates.

---

## 2. ROLLBACK PROCEDURE

### 2.1 Backward Compatibility
Because all new columns have default values and are additive, older versions of the backend or frontend can run against the migrated schema without errors.

### 2.2 Reversion Steps (If Rollback is Required)
1. Revert frontend deployment to prior release (the bell icon is safely removed from UI; backend continues functioning).
2. Revert backend deployment to prior container build (the older backend ignores newly added columns and continues using `notification_events` for outbox email dispatch).
3. Database columns can remain in place or be dropped if an explicit schema rollback is required:
```sql
DROP INDEX IF EXISTS idx_notification_events_in_app_feed;
DROP INDEX IF EXISTS idx_notification_events_admin_in_app;
ALTER TABLE notification_events 
    DROP COLUMN IF EXISTS is_read,
    DROP COLUMN IF EXISTS read_at,
    DROP COLUMN IF EXISTS action_url,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS target_role,
    DROP COLUMN IF EXISTS is_admin_notification;
```
