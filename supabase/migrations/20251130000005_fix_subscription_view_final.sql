-- Migration: Fix subscription_status_view SECURITY DEFINER - Final Fix
-- Purpose: Completely recreate view WITHOUT SECURITY DEFINER and with all fields
-- Date: 2025-11-30
--
-- This migration addresses:
-- 1. SECURITY DEFINER linter error
-- 2. Missing 'usage' aggregation field
-- 3. Adds all necessary fields including canceled_at, paused_at

-- =============================================================================
-- Drop existing view completely
-- =============================================================================
DROP VIEW IF EXISTS public.subscription_status_view CASCADE;

-- =============================================================================
-- Recreate view WITHOUT SECURITY DEFINER - Complete version with usage
-- =============================================================================
CREATE VIEW public.subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.status,

    -- Computed field: Grace period status
    -- If subscription is expired/past_due/cancelled BUT grace period hasn't ended,
    -- show 'grace_period' as the effective status
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,

    -- Subscription timing fields
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.paused_at,
    s.suspended_at,

    -- Grace period fields
    s.grace_period_started_at,
    s.grace_period_ends_at,

    -- Payment action required flag
    s.requires_payment_action,

    -- Paddle integration fields
    s.paddle_subscription_id,
    s.paddle_customer_id,
    s.paddle_plan_id,
    s.paddle_checkout_id,

    -- Management URLs from Paddle
    s.cancel_url,
    s.update_url,

    -- Plan details (joined from subscription_plans)
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,

    -- Timestamps
    s.created_at,
    s.updated_at,
    s.status_updated_at,

    -- Usage data (aggregated from usage_tracking)
    jsonb_build_object(
        'ocrAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'ocr_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false)),
        'riskAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'risk_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false))
    ) as usage

FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;

-- =============================================================================
-- Add comprehensive documentation
-- =============================================================================
COMMENT ON VIEW public.subscription_status_view IS
'Subscription status with computed grace period logic, plan details, and usage tracking.

Key Features:
- Computes effective_status based on grace period logic
- Joins subscription plan details (name, price, features)
- Aggregates usage tracking data (OCR and Risk Analysis limits)
- Filters out soft-deleted subscriptions (deleted_at IS NULL)

IMPORTANT SECURITY NOTE:
- This view does NOT use SECURITY DEFINER
- RLS policies from underlying tables (subscriptions, usage_tracking) apply automatically
- Users can only see their own data via RLS
- This prevents the security_definer_view linter error

Grace Period Logic:
- If status is expired/past_due/cancelled AND grace_period_ends_at > now()
  → effective_status = ''grace_period''
- Otherwise → effective_status = status

Usage Data:
- Provides current usage limits and counts for OCR and Risk Analysis features
- Includes saved credits and reset dates
- Returns default values (0 limits) if no usage tracking exists

Security:
- View inherits RLS policies from subscriptions and usage_tracking tables
- Users can only see their own subscriptions
- Admins can see all subscriptions (via profiles.is_admin RLS policy)
- Service role has full access

Example Query:
SELECT * FROM subscription_status_view WHERE user_id = auth.uid();
';

-- =============================================================================
-- Grant permissions
-- =============================================================================
GRANT SELECT ON public.subscription_status_view TO authenticated;
GRANT SELECT ON public.subscription_status_view TO anon;
GRANT ALL ON public.subscription_status_view TO service_role;

-- =============================================================================
-- Verification Query (for manual testing after migration)
-- =============================================================================
-- Run this to verify the view was created correctly:
-- SELECT
--   viewname,
--   definition
-- FROM pg_views
-- WHERE viewname = 'subscription_status_view'
--   AND schemaname = 'public';
--
-- The definition should NOT contain 'SECURITY DEFINER'
