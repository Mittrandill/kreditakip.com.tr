-- Migration: Cleanup Unused PayTR Tables
-- Purpose: Remove request_logs and webhook_logs tables that are no longer used
-- Date: 2025-11-30
--
-- Background:
-- - request_logs: Was used for PayTR request logging, replaced by Paddle's system
-- - webhook_logs: Was used for PayTR webhook logging, replaced by paddle_webhook_events
--
-- These tables are confirmed unused in the codebase after migration to Paddle

-- =============================================================================
-- Drop unused PayTR tables
-- =============================================================================

-- Drop webhook_logs table (replaced by paddle_webhook_events)
DROP TABLE IF EXISTS public.webhook_logs CASCADE;

-- Drop request_logs table (no longer needed with Paddle)
DROP TABLE IF EXISTS public.request_logs CASCADE;

-- =============================================================================
-- Add comment for audit trail
-- =============================================================================
COMMENT ON SCHEMA public IS 'Cleaned up unused PayTR tables (request_logs, webhook_logs) on 2025-11-30. These have been replaced by Paddle''s webhook system (paddle_webhook_events table).';
