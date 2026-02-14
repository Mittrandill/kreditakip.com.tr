-- RPC function for atomic subscription creation
-- Handles: soft-delete existing subscriptions, create new subscription, create usage records, log admin action
-- All operations are atomic (transaction) - if any step fails, all changes are rolled back

CREATE OR REPLACE FUNCTION admin_create_subscription(
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
  v_limits jsonb;
BEGIN
  -- Set default expires_at if not provided (30 days from now)
  v_expires_at := COALESCE(p_expires_at, now() + interval '30 days');
  v_reset_at := now() + interval '30 days';

  -- Get subscription limits based on plan type
  v_limits := CASE p_plan_type
    WHEN 'premium' THEN '{"ocr_limit": 999999, "risk_analysis_limit": 999999, "saved_credits_limit": 999999}'::jsonb
    WHEN 'pro' THEN '{"ocr_limit": 10, "risk_analysis_limit": 5, "saved_credits_limit": 10}'::jsonb
    ELSE '{"ocr_limit": -1, "risk_analysis_limit": 0, "saved_credits_limit": 1}'::jsonb
  END;

  -- 1. Soft-delete existing active subscriptions
  UPDATE public.subscriptions
  SET
    status = 'cancelled',
    deleted_at = now()
  WHERE
    user_id = p_user_id
    AND status = 'active'
    AND deleted_at IS NULL;

  -- 2. Create new subscription
  INSERT INTO public.subscriptions (
    user_id, plan_id, plan_type, status, start_date, expires_at, payment_provider
  )
  VALUES (
    p_user_id, p_plan_id, p_plan_type, 'active', now(), v_expires_at, NULL
  )
  RETURNING id INTO v_subscription_id;

  -- 3. Create usage records (OCR, Risk Analysis, Saved Credits)
  INSERT INTO public.subscription_usage (user_id, subscription_id, feature_type, usage_count, usage_limit, reset_at)
  VALUES
    (p_user_id, v_subscription_id, 'ocr_analysis', 0, (v_limits->>'ocr_limit')::int, v_reset_at),
    (p_user_id, v_subscription_id, 'risk_analysis', 0, (v_limits->>'risk_analysis_limit')::int, v_reset_at),
    (p_user_id, v_subscription_id, 'saved_credits', 0, (v_limits->>'saved_credits_limit')::int, v_reset_at);

  -- 4. Log admin action (if admin_id provided)
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id,
      description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_create', 'subscription', v_subscription_id, p_user_id,
      'Manuel ' || p_plan_type || ' abonelik oluşturuldu',
      jsonb_build_object('planId', p_plan_id, 'planType', p_plan_type, 'expiresAt', v_expires_at)
    );
  END IF;

  -- Return subscription details
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
    -- Roll back automatically (PostgreSQL function behavior)
    RAISE EXCEPTION 'Subscription creation failed: %', SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION admin_create_subscription IS 'Atomically create subscription with usage records and admin logging. All operations rollback on failure.';
