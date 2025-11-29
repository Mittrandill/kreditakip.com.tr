-- Migration: Consolidate Usage Tracking Tables
-- Purpose: Migrate from legacy usage_tracking to new subscription_usage table
-- Reason: subscription_usage has better schema design and tracks subscription_id

-- =============================================================================
-- Background
-- =============================================================================
-- Two tables currently exist:
-- 1. usage_tracking (old) - tracks usage by user_id only
-- 2. subscription_usage (new) - tracks usage by user_id + subscription_id
--
-- Problems with dual tables:
-- - Data inconsistency when both are used
-- - Confusion about which table is source of truth
-- - subscription_usage is better designed for Paddle integration
--
-- Solution:
-- 1. Migrate all data from usage_tracking to subscription_usage
-- 2. Back up usage_tracking for safety
-- 3. Mark usage_tracking as deprecated
-- 4. Update all code to use subscription_usage

-- =============================================================================
-- Step 1: Verify subscription_usage table exists and has correct structure
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_usage') THEN
    RAISE EXCEPTION 'subscription_usage table does not exist. Run paddle subscription migration first.';
  END IF;
END $$;

-- =============================================================================
-- Step 2: Create backup of usage_tracking before migration
-- =============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking_backup AS
SELECT * FROM usage_tracking;

-- Add comment to backup table
DO $$
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE usage_tracking_backup IS %L',
    'Backup of usage_tracking table created before migration to subscription_usage on ' || now()::text
  );
END $$;

-- Log backup
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM usage_tracking_backup;
  RAISE NOTICE 'Backed up % records from usage_tracking to usage_tracking_backup', backup_count;
END $$;

-- =============================================================================
-- Step 3: Migrate data from usage_tracking to subscription_usage
-- =============================================================================
-- Strategy:
-- - For each user in usage_tracking, find their active subscription
-- - Copy usage data with correct column name mapping
-- - Handle conflicts (ON CONFLICT DO UPDATE)

INSERT INTO subscription_usage (
  user_id,
  subscription_id,
  feature_type,
  usage_count,        -- maps from usage_tracking.used_count
  limit_count,
  saved_credits_count,
  reset_at,
  created_at,
  updated_at
)
SELECT
  ut.user_id,

  -- Find the user's active subscription
  -- Prefer active, then trialing, then past_due, then paused
  (
    SELECT s.id
    FROM subscriptions s
    WHERE s.user_id = ut.user_id
      AND s.deleted_at IS NULL
    ORDER BY
      CASE s.status
        WHEN 'active' THEN 1
        WHEN 'trialing' THEN 2
        WHEN 'past_due' THEN 3
        WHEN 'paused' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END,
      s.created_at DESC
    LIMIT 1
  ) as subscription_id,

  ut.feature_type,
  ut.used_count as usage_count,  -- Column name changed
  ut.limit_count,
  COALESCE(ut.saved_credits_count, 0) as saved_credits_count,
  ut.reset_at,
  ut.created_at,
  ut.updated_at

FROM usage_tracking ut

-- Handle conflicts: If record already exists, update with latest data
ON CONFLICT (user_id, feature_type)
DO UPDATE SET
  usage_count = EXCLUDED.usage_count,
  limit_count = EXCLUDED.limit_count,
  saved_credits_count = EXCLUDED.saved_credits_count,
  reset_at = EXCLUDED.reset_at,
  subscription_id = COALESCE(EXCLUDED.subscription_id, subscription_usage.subscription_id),
  updated_at = now();

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
  usage_tracking_count INTEGER;
  subscription_usage_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  SELECT COUNT(*) INTO usage_tracking_count FROM usage_tracking;
  SELECT COUNT(*) INTO subscription_usage_count FROM subscription_usage;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Processed % records from usage_tracking', migrated_count;
  RAISE NOTICE '  - usage_tracking total: %', usage_tracking_count;
  RAISE NOTICE '  - subscription_usage total: %', subscription_usage_count;

  IF subscription_usage_count < usage_tracking_count THEN
    RAISE WARNING 'subscription_usage has fewer records than usage_tracking. Some users may not have active subscriptions.';
  END IF;
END $$;

-- =============================================================================
-- Step 4: Create index for usage_tracking lookups (in case old code still references it)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature
ON usage_tracking(user_id, feature_type);

COMMENT ON INDEX idx_usage_tracking_user_feature IS
'Temporary index for backward compatibility. Remove when usage_tracking is dropped.';

-- =============================================================================
-- Step 5: Mark usage_tracking as deprecated
-- =============================================================================
DO $$
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE usage_tracking IS %L',
    'DEPRECATED: This table has been migrated to subscription_usage as of ' || now()::date || '.

DO NOT USE THIS TABLE. All new code should use subscription_usage instead.

Migration details:
- Backup: usage_tracking_backup
- New table: subscription_usage
- Key differences: subscription_usage tracks subscription_id and uses usage_count instead of used_count

This table will be dropped after a verification period (2-4 weeks).

To migrate your code:
  OLD: SELECT * FROM usage_tracking WHERE user_id = ... AND feature_type = ...
  NEW: SELECT * FROM subscription_usage WHERE user_id = ... AND feature_type = ...

Column mapping:
  used_count → usage_count
  (all other columns same)'
  );
END $$;

-- =============================================================================
-- Step 6: Ensure subscription_usage has proper constraints
-- =============================================================================
-- Add unique constraint if not exists (should exist from paddle migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscription_usage_user_feature_unique'
  ) THEN
    ALTER TABLE subscription_usage
    ADD CONSTRAINT subscription_usage_user_feature_unique
    UNIQUE (user_id, feature_type);

    RAISE NOTICE 'Added unique constraint on (user_id, feature_type)';
  END IF;
END $$;

-- =============================================================================
-- Step 7: Create helper function to sync usage (for transition period)
-- =============================================================================
-- During transition, some code might still write to usage_tracking
-- This trigger will sync changes to subscription_usage

CREATE OR REPLACE FUNCTION sync_usage_tracking_to_subscription_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update subscription_usage when usage_tracking changes
  INSERT INTO subscription_usage (
    user_id,
    subscription_id,
    feature_type,
    usage_count,
    limit_count,
    saved_credits_count,
    reset_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    (
      SELECT id FROM subscriptions
      WHERE user_id = NEW.user_id
        AND status IN ('active', 'trialing', 'past_due', 'paused')
        AND deleted_at IS NULL
      ORDER BY
        CASE status
          WHEN 'active' THEN 1
          WHEN 'trialing' THEN 2
          WHEN 'past_due' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 1
    ),
    NEW.feature_type,
    NEW.used_count,
    NEW.limit_count,
    COALESCE(NEW.saved_credits_count, 0),
    NEW.reset_at,
    now()
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    usage_count = EXCLUDED.usage_count,
    limit_count = EXCLUDED.limit_count,
    saved_credits_count = EXCLUDED.saved_credits_count,
    reset_at = EXCLUDED.reset_at,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_usage_tracking_to_subscription_usage() IS
'TEMPORARY: Syncs changes from usage_tracking to subscription_usage during transition period. Remove when usage_tracking is dropped.';

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_usage_tracking ON usage_tracking;
CREATE TRIGGER trigger_sync_usage_tracking
  AFTER INSERT OR UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_usage_tracking_to_subscription_usage();

COMMENT ON TRIGGER trigger_sync_usage_tracking ON usage_tracking IS
'TEMPORARY: Keeps subscription_usage in sync with usage_tracking writes. Remove when all code is migrated.';

-- =============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- =============================================================================
-- Run these after migration to verify correctness:

-- Check 1: Compare record counts
-- SELECT
--   'usage_tracking' as table_name, COUNT(*) as record_count
-- FROM usage_tracking
-- UNION ALL
-- SELECT
--   'subscription_usage' as table_name, COUNT(*) as record_count
-- FROM subscription_usage
-- UNION ALL
-- SELECT
--   'usage_tracking_backup' as table_name, COUNT(*) as record_count
-- FROM usage_tracking_backup;

-- Check 2: Verify data integrity
-- SELECT
--   ut.user_id,
--   ut.feature_type,
--   ut.used_count as old_used_count,
--   su.usage_count as new_usage_count,
--   ut.limit_count as old_limit,
--   su.limit_count as new_limit
-- FROM usage_tracking ut
-- LEFT JOIN subscription_usage su
--   ON ut.user_id = su.user_id
--   AND ut.feature_type = su.feature_type
-- WHERE ut.used_count != su.usage_count
--    OR ut.limit_count != su.limit_count;
-- -- Should return 0 rows if migration was perfect

-- Check 3: Find users without active subscriptions
-- SELECT
--   ut.user_id,
--   ut.feature_type,
--   COUNT(*) as usage_records
-- FROM usage_tracking ut
-- LEFT JOIN subscriptions s
--   ON s.user_id = ut.user_id
--   AND s.status IN ('active', 'trialing', 'past_due', 'paused')
--   AND s.deleted_at IS NULL
-- WHERE s.id IS NULL
-- GROUP BY ut.user_id, ut.feature_type;
-- -- These users have usage data but no active subscription

-- =============================================================================
-- CLEANUP PLAN (to be run after verification period)
-- =============================================================================
-- After 2-4 weeks of verification:
--
-- 1. Drop the sync trigger:
--    DROP TRIGGER IF EXISTS trigger_sync_usage_tracking ON usage_tracking;
--    DROP FUNCTION IF EXISTS sync_usage_tracking_to_subscription_usage();
--
-- 2. Drop the usage_tracking table:
--    DROP TABLE IF EXISTS usage_tracking CASCADE;
--
-- 3. Keep the backup:
--    -- Keep usage_tracking_backup for archival purposes
--
-- 4. Update documentation to reference only subscription_usage

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================
-- To rollback this migration:
--
-- -- Restore from backup
-- DELETE FROM usage_tracking;
-- INSERT INTO usage_tracking SELECT * FROM usage_tracking_backup;
--
-- -- Drop sync infrastructure
-- DROP TRIGGER IF EXISTS trigger_sync_usage_tracking ON usage_tracking;
-- DROP FUNCTION IF EXISTS sync_usage_tracking_to_subscription_usage();
--
-- -- Restore comment
-- COMMENT ON TABLE usage_tracking IS NULL;
