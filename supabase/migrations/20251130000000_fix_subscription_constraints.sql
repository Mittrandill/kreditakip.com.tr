-- Migration: Fix Subscription Constraints for Paddle Integration
-- Purpose: Fix CHECK constraints and add missing foreign key
-- This migration addresses the critical issue of premium users showing as free

-- =============================================================================
-- 1. Fix status CHECK constraint to include all Paddle statuses
-- =============================================================================
-- Paddle uses statuses: active, canceled, past_due, paused, trialing
-- Current constraint only has: active, cancelled, expired, suspended
-- This causes webhook failures when Paddle sends 'past_due', 'paused', or 'trialing'

ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_status_check
CHECK (status = ANY (ARRAY[
  'active'::text,
  'cancelled'::text,  -- British spelling (legacy)
  'canceled'::text,   -- American spelling (Paddle uses this)
  'expired'::text,
  'suspended'::text,
  'past_due'::text,   -- NEW: Paddle sends this when payment fails
  'paused'::text,     -- NEW: Paddle sends this when subscription paused
  'trialing'::text    -- NEW: Paddle sends this during trial period
]));

COMMENT ON CONSTRAINT subscriptions_status_check ON subscriptions IS
'Allows both British (cancelled) and American (canceled) spelling. Includes all Paddle statuses: active, canceled/cancelled, expired, suspended, past_due, paused, trialing';

-- =============================================================================
-- 2. CRITICAL FIX: Update existing premium subscriptions with wrong plan_type
-- =============================================================================
-- Root cause of "premium users showing as free" bug:
-- Subscriptions with plan_id 'pro-monthly', 'premium-yearly', etc. have plan_type = 'free'
-- This happens because the old plan_type field is legacy and not properly maintained
-- The correct field to check is plan_id, but for backward compatibility we fix plan_type

UPDATE subscriptions
SET
  plan_type = 'premium',
  updated_at = now()
WHERE plan_id IN ('pro-monthly', 'pro-yearly', 'premium-monthly', 'premium-yearly')
  AND plan_type != 'premium';

-- Log the fix
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % subscription(s) with incorrect plan_type', updated_count;
END $$;

-- =============================================================================
-- 3. Add missing foreign key for data integrity
-- =============================================================================
-- subscriptions.paddle_customer_id currently has no FK constraint
-- This allows orphaned references and data integrity issues

-- First, check if there are any orphaned references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM subscriptions s
  LEFT JOIN paddle_customers pc ON s.paddle_customer_id = pc.paddle_customer_id
  WHERE s.paddle_customer_id IS NOT NULL
    AND pc.paddle_customer_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned paddle_customer_id references. These will be set to NULL.', orphaned_count;

    -- Clean up orphaned references
    UPDATE subscriptions
    SET paddle_customer_id = NULL
    WHERE paddle_customer_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM paddle_customers pc
        WHERE pc.paddle_customer_id = subscriptions.paddle_customer_id
      );
  END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_paddle_customer_id_fkey
FOREIGN KEY (paddle_customer_id)
REFERENCES paddle_customers(paddle_customer_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT subscriptions_paddle_customer_id_fkey ON subscriptions IS
'Ensures paddle_customer_id references a valid Paddle customer. ON DELETE SET NULL allows customer deletion without breaking subscriptions.';

-- =============================================================================
-- 4. Add performance index for foreign key lookups
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_fk
ON subscriptions(paddle_customer_id)
WHERE paddle_customer_id IS NOT NULL;

COMMENT ON INDEX idx_subscriptions_paddle_customer_fk IS
'Improves performance of JOIN queries between subscriptions and paddle_customers. Partial index only on non-null values.';

-- =============================================================================
-- 5. Additional index for common query patterns
-- =============================================================================
-- Most queries filter by user_id and status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_subscriptions_user_status IS
'Optimizes queries that filter by user_id and status (most common pattern). Partial index excludes soft-deleted records.';

-- =============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- =============================================================================
-- Run these after migration to verify correctness:

-- Check 1: All premium/pro plans should have plan_type = 'premium'
-- SELECT plan_id, plan_type, status, COUNT(*)
-- FROM subscriptions
-- WHERE plan_id LIKE '%premium%' OR plan_id LIKE '%pro-%'
-- GROUP BY plan_id, plan_type, status
-- ORDER BY plan_id;
-- Expected: All rows should have plan_type = 'premium'

-- Check 2: No orphaned paddle_customer_id references
-- SELECT COUNT(*) as orphaned_count
-- FROM subscriptions s
-- LEFT JOIN paddle_customers pc ON s.paddle_customer_id = pc.paddle_customer_id
-- WHERE s.paddle_customer_id IS NOT NULL
--   AND pc.paddle_customer_id IS NULL;
-- Expected: 0

-- Check 3: Verify constraint allows all Paddle statuses
-- SELECT status, COUNT(*)
-- FROM subscriptions
-- GROUP BY status
-- ORDER BY status;
-- Expected: No constraint violation errors

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================
-- To rollback this migration:
--
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_paddle_customer_id_fkey;
-- DROP INDEX IF EXISTS idx_subscriptions_paddle_customer_fk;
-- DROP INDEX IF EXISTS idx_subscriptions_user_status;
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
-- ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
--   CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'suspended'::text]));
