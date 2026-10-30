-- Sporekart Database Migration V46: Create ShedLock table for multi-node distributed cron coordination
-- Prevents race conditions and duplicate task execution across multiple backend instances

CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_by VARCHAR(255) NOT NULL
);
