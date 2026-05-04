-- Fix subscription limits and add monthly reset support
--
-- Changes:
-- 1. Premium plan: use -1 (unlimited) for OCR/risk limits instead of 999999
-- 2. admin_update_subscription: reset usage_count=0 and reset_at when plan changes
-- 3. track_ocr_analysis: use -1 for premium (not 999999)
-- 4. New function check_ocr_monthly_reset: resets monthly quota if reset_at has passed
--    and returns current state so callers can enforce limits

-- =====================================================================
-- 1. Fix admin_create_subscription: use -1 for unlimited (premium)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_create_subscription(
  p_user_id uuid,
  p_plan_id text,
  p_plan_type text,
  p_expires_at timestamptz DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription_id uuid;
  v_expires_at timestamptz;
  v_reset_at timestamptz;
  v_ocr_limit int;
  v_risk_limit int;
  v_saved_credits_limit int;
BEGIN
  v_expires_at := COALESCE(p_expires_at, now() + interval '30 days');
  v_reset_at := now() + interval '30 days';

  -- Set limits based on plan type
  -- -1 = unlimited, positive number = monthly limit
  CASE p_plan_type
    WHEN 'premium' THEN
      v_ocr_limit := -1;           -- unlimited OCR analyses
      v_risk_limit := -1;          -- unlimited risk analyses
      v_saved_credits_limit := -1; -- unlimited credit saves
    WHEN 'pro' THEN
      v_ocr_limit := 10;           -- 10 OCR analyses per month
      v_risk_limit := 5;           -- 5 risk analyses per month
      v_saved_credits_limit := 10; -- 10 credit saves per month
    ELSE
      v_ocr_limit := -1;           -- free: unlimited OCR (stats only)
      v_risk_limit := 0;           -- free: no risk analysis
      v_saved_credits_limit := 1;  -- free: 1 save per month
  END CASE;

  -- Soft-delete existing active subscriptions
  UPDATE public.subscriptions
  SET status = 'cancelled', deleted_at = now()
  WHERE user_id = p_user_id AND status = 'active' AND deleted_at IS NULL;

  -- Create new subscription
  INSERT INTO public.subscriptions (user_id, plan_id, plan_type, status, start_date, expires_at, payment_provider)
  VALUES (p_user_id, p_plan_id, p_plan_type, 'active', now(), v_expires_at, NULL)
  RETURNING id INTO v_subscription_id;

  -- Upsert usage records (UNIQUE constraint on user_id + feature_type)
  -- Reset usage_count=0 for fresh start on new subscription
  INSERT INTO public.subscription_usage (user_id, subscription_id, feature_type, usage_count, limit_count, saved_credits_limit, reset_at)
  VALUES
    (p_user_id, v_subscription_id, 'ocr_analysis', 0, v_ocr_limit, v_saved_credits_limit, v_reset_at),
    (p_user_id, v_subscription_id, 'risk_analysis', 0, v_risk_limit, v_saved_credits_limit, v_reset_at)
  ON CONFLICT (user_id, feature_type) DO UPDATE SET
    subscription_id = v_subscription_id,
    limit_count = EXCLUDED.limit_count,
    saved_credits_limit = EXCLUDED.saved_credits_limit,
    usage_count = 0,
    saved_credits_count = 0,
    reset_at = v_reset_at,
    updated_at = now();

  -- Log admin action if admin_id provided
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id, description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_create', 'subscription', v_subscription_id, p_user_id,
      'Manuel ' || p_plan_type || ' abonelik oluşturuldu',
      jsonb_build_object('planId', p_plan_id, 'planType', p_plan_type, 'expiresAt', v_expires_at)
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_subscription_id,
    'user_id', p_user_id,
    'plan_id', p_plan_id,
    'plan_type', p_plan_type,
    'status', 'active',
    'start_date', now(),
    'expires_at', v_expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Subscription creation failed: %', SQLERRM;
END;
$$;

-- =====================================================================
-- 2. Fix admin_update_subscription: use -1 for unlimited + reset usage
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_subscription_id uuid,
  p_plan_id text,
  p_plan_type text,
  p_user_id uuid,
  p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated_subscription record;
  v_ocr_limit int;
  v_risk_limit int;
  v_saved_credits_limit int;
  v_reset_at timestamptz;
BEGIN
  v_reset_at := now() + interval '30 days';

  -- Set limits based on plan type
  CASE p_plan_type
    WHEN 'premium' THEN
      v_ocr_limit := -1;
      v_risk_limit := -1;
      v_saved_credits_limit := -1;
    WHEN 'pro' THEN
      v_ocr_limit := 10;
      v_risk_limit := 5;
      v_saved_credits_limit := 10;
    ELSE
      v_ocr_limit := -1;
      v_risk_limit := 0;
      v_saved_credits_limit := 1;
  END CASE;

  -- Update subscription plan
  UPDATE public.subscriptions
  SET plan_id = p_plan_id, plan_type = p_plan_type, updated_at = now()
  WHERE id = p_subscription_id
  RETURNING * INTO v_updated_subscription;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  -- Update OCR analysis usage limits AND reset monthly counters for fresh start
  UPDATE public.subscription_usage
  SET
    limit_count = v_ocr_limit,
    saved_credits_limit = v_saved_credits_limit,
    usage_count = 0,
    saved_credits_count = 0,
    reset_at = v_reset_at,
    updated_at = now()
  WHERE user_id = p_user_id AND feature_type = 'ocr_analysis';

  -- Update risk analysis usage limits AND reset monthly counters
  UPDATE public.subscription_usage
  SET
    limit_count = v_risk_limit,
    usage_count = 0,
    saved_credits_count = 0,
    reset_at = v_reset_at,
    updated_at = now()
  WHERE user_id = p_user_id AND feature_type = 'risk_analysis';

  -- Log admin action if admin_id provided
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id, description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_update', 'subscription', p_subscription_id, p_user_id,
      'Abonelik planı ' || p_plan_type || ' olarak güncellendi',
      jsonb_build_object('planId', p_plan_id, 'planType', p_plan_type)
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_updated_subscription.id,
    'user_id', v_updated_subscription.user_id,
    'plan_id', v_updated_subscription.plan_id,
    'plan_type', v_updated_subscription.plan_type,
    'status', v_updated_subscription.status,
    'expires_at', v_updated_subscription.expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Subscription update failed: %', SQLERRM;
END;
$$;

-- =====================================================================
-- 3. Fix track_ocr_analysis: use -1 for premium (not 999999)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.track_ocr_analysis(
  p_user_id UUID,
  p_feature_type TEXT DEFAULT 'ocr_analysis'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_record RECORD;
BEGIN
  SELECT *
  INTO v_usage_record
  FROM subscription_usage
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type;

  IF v_usage_record IS NULL THEN
    -- Create initial usage record from user's current subscription
    INSERT INTO subscription_usage (
      user_id, subscription_id, feature_type, usage_count, limit_count,
      saved_credits_count, saved_credits_limit, reset_at, created_at, updated_at
    )
    SELECT
      p_user_id,
      s.id,
      p_feature_type,
      1,
      CASE
        WHEN s.plan_type = 'premium' THEN -1  -- unlimited
        WHEN s.plan_type = 'pro' THEN 10
        ELSE -1  -- free: unlimited analyses (only saves are limited)
      END,
      0,
      CASE
        WHEN s.plan_type = 'premium' THEN -1
        WHEN s.plan_type = 'pro' THEN 10
        ELSE 1
      END,
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'canceled', 'paused', 'past_due')
      AND s.deleted_at IS NULL
    ORDER BY
      CASE s.status
        WHEN 'active' THEN 1
        WHEN 'paused' THEN 2
        WHEN 'past_due' THEN 3
        WHEN 'canceled' THEN 4
        ELSE 5
      END,
      s.created_at DESC
    LIMIT 1
    ON CONFLICT (user_id, feature_type) DO NOTHING;

    IF NOT FOUND THEN
      INSERT INTO subscription_usage (
        user_id, feature_type, usage_count, limit_count,
        saved_credits_count, saved_credits_limit, reset_at, created_at, updated_at
      )
      VALUES (
        p_user_id, p_feature_type, 1, -1, 0, 1,
        NOW() + INTERVAL '30 days', NOW(), NOW()
      )
      ON CONFLICT (user_id, feature_type) DO NOTHING;
    END IF;
  ELSE
    UPDATE subscription_usage
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND feature_type = p_feature_type;
  END IF;

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'track_ocr_analysis error for user %: %', p_user_id, SQLERRM;
    RETURN TRUE;
END;
$$;

-- =====================================================================
-- 4. New function: check_ocr_monthly_reset
--    Resets monthly quota if reset_at has passed, returns current state.
--    Called by /api/analyze-pdf before running OCR to enforce Pro limit.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.check_ocr_monthly_reset(p_user_id uuid)
RETURNS TABLE(limit_count int, usage_count int, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Reset monthly counters if the reset period has passed
  UPDATE public.subscription_usage
  SET
    usage_count = 0,
    saved_credits_count = 0,
    reset_at = now() + interval '30 days',
    updated_at = now()
  WHERE user_id = p_user_id
    AND feature_type = 'ocr_analysis'
    AND reset_at IS NOT NULL
    AND reset_at < now();

  -- Return current usage state
  RETURN QUERY
  SELECT su.limit_count, su.usage_count, su.reset_at
  FROM public.subscription_usage su
  WHERE su.user_id = p_user_id
    AND su.feature_type = 'ocr_analysis'
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ocr_monthly_reset(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ocr_monthly_reset(uuid) TO service_role;

COMMENT ON FUNCTION public.check_ocr_monthly_reset IS
'Resets OCR monthly quota if reset_at has passed, then returns current limit_count
and usage_count. Called before OCR analysis to enforce Pro plan 10/month limit.
Returns empty if no usage record exists (treat as unlimited).';

-- =====================================================================
-- 5. Also fix subscription_expiry_check reset values:
--    When subscription expires, reset to free plan limits:
--    ocr_analysis: limit_count = -1 (unlimited for free)
--    risk_analysis: limit_count = 0 (no risk for free)
--    (These are already correct in the cron job, documenting here for clarity)
-- =====================================================================

COMMENT ON FUNCTION public.admin_create_subscription IS
'Creates subscription with correct limits: Premium=-1(unlimited), Pro=10/month, Free=-1 OCR only.
Resets usage_count=0 for fresh start. Uses UPSERT to handle existing usage rows.';

COMMENT ON FUNCTION public.admin_update_subscription IS
'Updates subscription plan and resets monthly usage counters (usage_count=0, new reset_at).
Premium: -1 (unlimited). Pro: 10 OCR/month, 5 risk/month. Also logs admin action.';
