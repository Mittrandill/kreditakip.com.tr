-- ============================================
-- Add plan_id to subscriptions table (if needed)
-- ============================================
-- Run this ONLY if subscriptions table doesn't have plan_id column

-- First, check if plan_id already exists
DO $$
BEGIN
  -- Add plan_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id TEXT;
    RAISE NOTICE 'Added plan_id column to subscriptions';
  ELSE
    RAISE NOTICE 'plan_id column already exists';
  END IF;

  -- Add iyzico_payment_id if it doesn't exist (separate from iyzico_subscription_id)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'iyzico_payment_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN iyzico_payment_id TEXT;
    RAISE NOTICE 'Added iyzico_payment_id column to subscriptions';
  ELSE
    RAISE NOTICE 'iyzico_payment_id column already exists';
  END IF;
END $$;

-- Backfill plan_id for existing subscriptions based on plan_type
-- This maps old data to new plan structure
UPDATE subscriptions
SET plan_id = CASE
  WHEN plan_type = 'premium' AND (expires_at - start_date) > INTERVAL '90 days' THEN 'premium-yearly'
  WHEN plan_type = 'premium' THEN 'premium-monthly'
  ELSE 'premium-monthly' -- default
END
WHERE plan_id IS NULL;

-- Verify the migration
SELECT
  'Migration Results' as info,
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE plan_id IS NOT NULL) as with_plan_id,
  COUNT(*) FILTER (WHERE plan_id IS NULL) as without_plan_id
FROM subscriptions;

-- Show plan distribution
SELECT
  plan_id,
  COUNT(*) as count,
  MIN(created_at) as first_subscription,
  MAX(created_at) as last_subscription
FROM subscriptions
WHERE plan_id IS NOT NULL
GROUP BY plan_id
ORDER BY count DESC;

COMMENT ON COLUMN subscriptions.plan_id IS 'References subscription_plans.id - e.g. premium-monthly, premium-yearly';
COMMENT ON COLUMN subscriptions.iyzico_payment_id IS 'Iyzico payment ID from PCI-DSS compliant checkout flow';
