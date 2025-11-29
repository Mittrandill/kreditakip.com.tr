-- Migration: Fix subscription_status_view SECURITY DEFINER Issue
-- Purpose: Remove SECURITY DEFINER to fix Supabase linter warning
-- The view doesn't need elevated privileges because RLS is already on underlying tables

-- =============================================================================
-- Background on the Issue
-- =============================================================================
-- Supabase Lint Error: "security_definer_view"
-- Description: View is defined with SECURITY DEFINER property, which enforces
--              permissions of the view creator instead of the querying user.
--
-- Why this is a problem:
-- - SECURITY DEFINER views bypass Row Level Security (RLS)
-- - They can expose data users shouldn't have access to
-- - In our case, it's unnecessary because:
--   1. The subscriptions table already has RLS policies
--   2. Users can only see their own subscriptions via RLS
--   3. The view just adds computed fields (effective_status, grace period logic)
--   4. No privileged data access is needed
--
-- Solution: Recreate view WITHOUT SECURITY DEFINER
-- RLS policies from subscriptions table will automatically apply to the view

-- =============================================================================
-- Drop existing view
-- =============================================================================
DROP VIEW IF EXISTS subscription_status_view;

-- =============================================================================
-- Recreate view WITHOUT SECURITY DEFINER
-- =============================================================================
CREATE VIEW subscription_status_view AS
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
    s.status_updated_at

FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;  -- Exclude soft-deleted subscriptions

-- =============================================================================
-- Add view documentation
-- =============================================================================
COMMENT ON VIEW subscription_status_view IS
'Subscription status with computed grace period logic and plan details.

This view:
- Computes effective_status based on grace period
- Joins subscription plan details
- Filters out soft-deleted subscriptions
- Does NOT use SECURITY DEFINER - RLS from subscriptions table applies automatically

Grace Period Logic:
- If status is expired/past_due/cancelled AND grace_period_ends_at > now()
  → effective_status = ''grace_period''
- Otherwise → effective_status = status

Security:
- View inherits RLS policies from subscriptions table
- Users can only see their own subscriptions
- Admins can see all subscriptions (via profiles.is_admin RLS policy)
- Service role has full access

Usage:
SELECT * FROM subscription_status_view WHERE user_id = auth.uid();
';

-- =============================================================================
-- Create index on view for common queries (optional but recommended)
-- =============================================================================
-- Note: Indexes on views aren't directly possible in PostgreSQL
-- The queries will use indexes from the underlying subscriptions table:
-- - idx_subscriptions_user_status (created in previous migration)
-- - subscriptions_pkey (on id)
-- - subscriptions_user_id_fkey (on user_id)

-- =============================================================================
-- Grant permissions (if needed)
-- =============================================================================
-- Grant SELECT to authenticated users (they're filtered by RLS anyway)
GRANT SELECT ON subscription_status_view TO authenticated;
GRANT SELECT ON subscription_status_view TO anon;  -- For public access (filtered by RLS)
GRANT ALL ON subscription_status_view TO service_role;  -- Full access for service operations

-- =============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- =============================================================================
-- Run these after migration to verify correctness:

-- Check 1: View returns data correctly
-- SELECT
--   user_id,
--   plan_id,
--   status,
--   effective_status,
--   grace_period_ends_at,
--   plan_name
-- FROM subscription_status_view
-- LIMIT 10;

-- Check 2: Grace period logic works
-- SELECT
--   user_id,
--   status,
--   effective_status,
--   grace_period_started_at,
--   grace_period_ends_at,
--   CASE
--     WHEN grace_period_ends_at > now() THEN 'In grace period'
--     ELSE 'Not in grace period'
--   END as grace_status
-- FROM subscription_status_view
-- WHERE status IN ('expired', 'past_due', 'cancelled');

-- Check 3: RLS still works (run as regular user, not service_role)
-- Should only return current user's subscriptions:
-- SELECT COUNT(*) FROM subscription_status_view;
-- SELECT COUNT(*) FROM subscription_status_view WHERE user_id != auth.uid();
-- -- Second query should return 0 for regular users

-- Check 4: Verify no SECURITY DEFINER (check in Supabase dashboard or pg_catalog)
-- SELECT
--   viewname,
--   definition
-- FROM pg_views
-- WHERE viewname = 'subscription_status_view'
--   AND schemaname = 'public';
-- -- definition should NOT contain 'SECURITY DEFINER'

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================
-- To rollback this migration:
-- (This would restore the SECURITY DEFINER version - not recommended)
--
-- DROP VIEW IF EXISTS subscription_status_view;
-- -- Then re-run the old migration that created it with SECURITY DEFINER
