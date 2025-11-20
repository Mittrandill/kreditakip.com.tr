-- Migration: Update notification_type constraint to support new types
-- Date: 2025-11-20
-- Description: Add support for app_reminder_3_days, app_reminder_1_day, and app_reminder_today

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Create the new constraint with ALL supported types (mevcut + yeni)
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check CHECK (notification_type IN ('email', 'app', 'app_reminder', 'app_overdue', 'app_reminder_3_days', 'app_reminder_1_day', 'app_reminder_today'));
