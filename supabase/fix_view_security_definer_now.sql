-- IMMEDIATE FIX for SECURITY DEFINER issue
-- Run this directly in Supabase SQL Editor

-- 1. Drop existing view
DROP VIEW IF EXISTS public.subscription_status_view CASCADE;

-- 2. Recreate WITHOUT SECURITY DEFINER
CREATE VIEW public.subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.status,
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.paused_at,
    s.suspended_at,
    s.grace_period_started_at,
    s.grace_period_ends_at,
    s.requires_payment_action,
    s.paddle_subscription_id,
    s.paddle_customer_id,
    s.paddle_plan_id,
    s.paddle_checkout_id,
    s.cancel_url,
    s.update_url,
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,
    s.created_at,
    s.updated_at,
    s.status_updated_at,
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
            WHERE ut.user_id = s.user_id AND ut.feature_type = 'ocr_analysis'
            ORDER BY ut.created_at DESC LIMIT 1
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
            WHERE ut.user_id = s.user_id AND ut.feature_type = 'risk_analysis'
            ORDER BY ut.created_at DESC LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false))
    ) as usage
FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;

-- 3. Grant permissions
GRANT SELECT ON public.subscription_status_view TO authenticated;
GRANT SELECT ON public.subscription_status_view TO anon;
GRANT ALL ON public.subscription_status_view TO service_role;

-- 4. Verify the view was created correctly (should NOT show SECURITY DEFINER)
SELECT
    viewname,
    CASE
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
        ELSE '✅ No SECURITY DEFINER (correct!)'
    END as status
FROM pg_views
WHERE viewname = 'subscription_status_view' AND schemaname = 'public';
