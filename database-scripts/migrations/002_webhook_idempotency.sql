-- Migration: Add Webhook Idempotency Constraint
-- Purpose: Prevent duplicate webhook processing
-- Date: 2025-11-20
-- Related Issue: Security improvements - webhook idempotency

-- Add unique constraint to prevent duplicate webhook events
-- This ensures that the same webhook event (identified by subscription_reference + event_type)
-- can only be processed once, preventing double charging or duplicate actions.

DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_webhook_event'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE webhook_logs
        ADD CONSTRAINT unique_webhook_event
        UNIQUE (subscription_reference, event_type);

        RAISE NOTICE 'Constraint unique_webhook_event added successfully';
    ELSE
        RAISE NOTICE 'Constraint unique_webhook_event already exists, skipping';
    END IF;
END $$;

-- Optional: Create an index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_lookup
ON webhook_logs (subscription_reference, event_type, status);

-- Optional: Add a comment to document the constraint
COMMENT ON CONSTRAINT unique_webhook_event ON webhook_logs IS
'Prevents duplicate processing of the same webhook event. Combination of subscription_reference and event_type must be unique.';

-- Verification query (run this to confirm the constraint was added)
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'webhook_logs'::regclass
-- AND conname = 'unique_webhook_event';
