-- RPC function for atomic subscription update
-- Handles: update subscription plan, update usage limits, log admin action
-- All operations are atomic (transaction) - if any step fails, all changes are rolled back

CREATE OR REPLACE FUNCTION admin_update_subscription(
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
  v_limits jsonb;
  v_updated_subscription record;
BEGIN
  -- Get subscription limits based on plan type
  v_limits := CASE p_plan_type
    WHEN 'premium' THEN '{"ocr_limit": 999999, "risk_analysis_limit": 999999, "saved_credits_limit": 999999}'::jsonb
    WHEN 'pro' THEN '{"ocr_limit": 10, "risk_analysis_limit": 5, "saved_credits_limit": 10}'::jsonb
    ELSE '{"ocr_limit": -1, "risk_analysis_limit": 0, "saved_credits_limit": 1}'::jsonb
  END;

  -- 1. Update subscription plan
  UPDATE public.subscriptions
  SET
    plan_id = p_plan_id,
    plan_type = p_plan_type,
    updated_at = now()
  WHERE
    id = p_subscription_id
  RETURNING * INTO v_updated_subscription;

  -- Check if subscription exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  -- 2. Update OCR usage limit
  UPDATE public.subscription_usage
  SET
    usage_limit = (v_limits->>'ocr_limit')::int,
    updated_at = now()
  WHERE
    subscription_id = p_subscription_id
    AND feature_type = 'ocr_analysis';

  -- 3. Update Risk Analysis usage limit
  UPDATE public.subscription_usage
  SET
    usage_limit = (v_limits->>'risk_analysis_limit')::int,
    updated_at = now()
  WHERE
    subscription_id = p_subscription_id
    AND feature_type = 'risk_analysis';

  -- 4. Update Saved Credits usage limit
  UPDATE public.subscription_usage
  SET
    usage_limit = (v_limits->>'saved_credits_limit')::int,
    updated_at = now()
  WHERE
    subscription_id = p_subscription_id
    AND feature_type = 'saved_credits';

  -- 5. Log admin action (if admin_id provided)
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id,
      description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_update', 'subscription', p_subscription_id, p_user_id,
      'Abonelik planı ' || p_plan_type || ' olarak güncellendi',
      jsonb_build_object('planId', p_plan_id, 'planType', p_plan_type)
    );
  END IF;

  -- Return updated subscription details
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
    -- Roll back automatically (PostgreSQL function behavior)
    RAISE EXCEPTION 'Subscription update failed: %', SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION admin_update_subscription IS 'Atomically update subscription plan and usage limits. All operations rollback on failure.';
