-- Add saved_credits_limit to subscription_status_view
-- First add the column to usage_tracking table if it doesn't exist
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS saved_credits_limit INTEGER DEFAULT 1;

-- Update existing records based on limit_count
UPDATE usage_tracking
SET saved_credits_limit = CASE
  WHEN feature_type = 'ocr_analysis' AND limit_count = 999999 THEN 999999  -- Premium: unlimited
  WHEN feature_type = 'ocr_analysis' AND limit_count >= 10 THEN 10         -- Pro: 10
  WHEN feature_type = 'ocr_analysis' THEN 1                                 -- Free: 1
  ELSE 1
END
WHERE feature_type = 'ocr_analysis';

-- Drop and recreate the view with savedCreditsLimit
DROP VIEW IF EXISTS public.subscription_status_view;

CREATE VIEW public.subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.plan_type,
    s.status,

    -- Computed field: Grace period status
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

    -- Plan details
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,

    -- Timestamps
    s.created_at,
    s.updated_at,
    s.deleted_at,

    -- Usage tracking with savedCreditsLimit
    COALESCE(
        jsonb_object_agg(
            u.feature_type,
            jsonb_build_object(
                'limit', COALESCE(u.limit_count, -1),
                'used', COALESCE(u.used_count, 0),
                'savedCredits', COALESCE(u.saved_credits_count, 0),
                'savedCreditsLimit', COALESCE(u.saved_credits_limit, 1),
                'resetAt', u.reset_at,
                'canUse', CASE
                    WHEN u.limit_count = -1 THEN true
                    WHEN u.limit_count IS NULL THEN false
                    ELSE u.used_count < u.limit_count
                END
            )
        ) FILTER (WHERE u.feature_type IS NOT NULL),
        '{}'::jsonb
    ) as usage

FROM public.subscriptions s
LEFT JOIN public.subscription_plans sp ON s.plan_id = sp.id
LEFT JOIN public.usage_tracking u ON s.user_id = u.user_id
WHERE s.deleted_at IS NULL
GROUP BY
    s.id,
    s.user_id,
    s.plan_id,
    s.plan_type,
    s.status,
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
    sp.name,
    sp.description,
    sp.price,
    sp.currency,
    sp.billing_period,
    sp.features,
    s.created_at,
    s.updated_at,
    s.deleted_at;

-- Grant permissions
GRANT SELECT ON public.subscription_status_view TO authenticated;

-- Add comment
COMMENT ON VIEW public.subscription_status_view IS 'Comprehensive view of subscription status including savedCreditsLimit (1 for free, 10 for pro, unlimited for premium)';
COMMENT ON COLUMN usage_tracking.saved_credits_limit IS 'Maximum number of credits that can be saved from OCR analysis';
