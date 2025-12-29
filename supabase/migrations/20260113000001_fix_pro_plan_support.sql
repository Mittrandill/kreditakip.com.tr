-- Fix Pro Plan Support
-- This migration addresses multiple issues with Pro subscriptions:
-- 1. Add 'pro' to plan_type check constraint
-- 2. Fix existing Pro subscriptions that were marked as 'premium'
-- 3. Update subscription_usage limits for Pro users
-- 4. Mark old canceled subscriptions as deleted to prevent duplicates

-- Step 1: Drop and recreate plan_type check constraint to include 'pro'
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_type_check
CHECK (plan_type = ANY (ARRAY[
  'free'::text,
  'pro'::text,
  'premium'::text
]));

COMMENT ON CONSTRAINT subscriptions_plan_type_check ON subscriptions IS
'Allows three plan types: free (default), pro (mid-tier), premium (top-tier)';

-- Step 2: Mark old canceled subscriptions as deleted to prevent duplicates in subscription_status_view
UPDATE public.subscriptions
SET deleted_at = COALESCE(canceled_at, updated_at)
WHERE status = 'canceled'
  AND deleted_at IS NULL
  AND canceled_at IS NOT NULL;

-- Step 3: Fix plan_type for Pro subscriptions that were incorrectly marked as premium
UPDATE public.subscriptions
SET
  plan_type = 'pro',
  updated_at = NOW()
WHERE (plan_id = 'pro-monthly' OR plan_id = 'pro-yearly')
  AND plan_type != 'pro'
  AND deleted_at IS NULL;

-- Step 4: Ensure Premium subscriptions have correct plan_type
UPDATE public.subscriptions
SET
  plan_type = 'premium',
  updated_at = NOW()
WHERE (plan_id = 'premium-monthly' OR plan_id = 'premium-yearly')
  AND plan_type != 'premium'
  AND deleted_at IS NULL;

-- Step 5: Fix subscription_usage limits for Pro users
-- Pro plan should have: OCR = 10, AI Risk Analysis = 5
UPDATE public.subscription_usage su
SET
  limit_count = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 10
    WHEN su.feature_type = 'risk_analysis' THEN 5
    ELSE su.limit_count
  END,
  saved_credits_limit = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 10
    ELSE su.saved_credits_limit
  END,
  updated_at = NOW()
FROM public.subscriptions s
WHERE su.user_id = s.user_id
  AND s.plan_type = 'pro'
  AND s.status = 'active'
  AND s.deleted_at IS NULL
  AND (
    (su.feature_type = 'ocr_analysis' AND su.limit_count != 10)
    OR (su.feature_type = 'risk_analysis' AND su.limit_count != 5)
  );

-- Step 6: Fix Premium users' limits (should be unlimited - 999999)
UPDATE public.subscription_usage su
SET
  limit_count = 999999,
  saved_credits_limit = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 999999
    ELSE su.saved_credits_limit
  END,
  updated_at = NOW()
FROM public.subscriptions s
WHERE su.user_id = s.user_id
  AND s.plan_type = 'premium'
  AND s.status = 'active'
  AND s.deleted_at IS NULL
  AND su.limit_count != 999999;

-- Add helpful comment
COMMENT ON TABLE public.subscription_usage IS 'Usage tracking with correct limits: Free (OCR:1, Risk:0), Pro (OCR:10, Risk:5), Premium (OCR:999999, Risk:999999)';

-- Verification queries (commented out for production)
-- SELECT plan_id, plan_type, status, COUNT(*)
-- FROM subscriptions
-- WHERE deleted_at IS NULL
-- GROUP BY plan_id, plan_type, status
-- ORDER BY plan_id;
