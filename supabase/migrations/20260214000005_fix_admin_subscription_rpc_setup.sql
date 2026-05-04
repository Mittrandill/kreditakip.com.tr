-- Consolidated fix for admin subscription RPC setup
-- Ensures admin_action_logs table exists before RPC functions
-- Safe to run multiple times (idempotent)

-- 1. Create admin_action_logs table if not exists
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON public.admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target_user_id ON public.admin_action_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type ON public.admin_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON public.admin_action_logs(created_at DESC);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_action_logs'
    AND policyname = 'Admins can view all admin action logs'
  ) THEN
    CREATE POLICY "Admins can view all admin action logs"
    ON public.admin_action_logs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_action_logs'
    AND policyname = 'Service role can insert admin action logs'
  ) THEN
    CREATE POLICY "Service role can insert admin action logs"
    ON public.admin_action_logs FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- 2. Create/replace admin_create_subscription RPC
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
  v_limits jsonb;
BEGIN
  v_expires_at := COALESCE(p_expires_at, now() + interval '30 days');
  v_reset_at := now() + interval '30 days';

  v_limits := CASE p_plan_type
    WHEN 'premium' THEN '{"ocr_limit": 999999, "risk_analysis_limit": 999999, "saved_credits_limit": 999999}'::jsonb
    WHEN 'pro' THEN '{"ocr_limit": 10, "risk_analysis_limit": 5, "saved_credits_limit": 10}'::jsonb
    ELSE '{"ocr_limit": -1, "risk_analysis_limit": 0, "saved_credits_limit": 1}'::jsonb
  END;

  UPDATE public.subscriptions
  SET status = 'cancelled', deleted_at = now()
  WHERE user_id = p_user_id AND status = 'active' AND deleted_at IS NULL;

  INSERT INTO public.subscriptions (user_id, plan_id, plan_type, status, start_date, expires_at, payment_provider)
  VALUES (p_user_id, p_plan_id, p_plan_type, 'active', now(), v_expires_at, NULL)
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.subscription_usage (user_id, subscription_id, feature_type, usage_count, usage_limit, reset_at)
  VALUES
    (p_user_id, v_subscription_id, 'ocr_analysis', 0, (v_limits->>'ocr_limit')::int, v_reset_at),
    (p_user_id, v_subscription_id, 'risk_analysis', 0, (v_limits->>'risk_analysis_limit')::int, v_reset_at),
    (p_user_id, v_subscription_id, 'saved_credits', 0, (v_limits->>'saved_credits_limit')::int, v_reset_at);

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

-- 3. Create/replace admin_update_subscription RPC
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
  v_limits jsonb;
  v_updated_subscription record;
BEGIN
  v_limits := CASE p_plan_type
    WHEN 'premium' THEN '{"ocr_limit": 999999, "risk_analysis_limit": 999999, "saved_credits_limit": 999999}'::jsonb
    WHEN 'pro' THEN '{"ocr_limit": 10, "risk_analysis_limit": 5, "saved_credits_limit": 10}'::jsonb
    ELSE '{"ocr_limit": -1, "risk_analysis_limit": 0, "saved_credits_limit": 1}'::jsonb
  END;

  UPDATE public.subscriptions
  SET plan_id = p_plan_id, plan_type = p_plan_type, updated_at = now()
  WHERE id = p_subscription_id
  RETURNING * INTO v_updated_subscription;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  UPDATE public.subscription_usage
  SET usage_limit = (v_limits->>'ocr_limit')::int, updated_at = now()
  WHERE subscription_id = p_subscription_id AND feature_type = 'ocr_analysis';

  UPDATE public.subscription_usage
  SET usage_limit = (v_limits->>'risk_analysis_limit')::int, updated_at = now()
  WHERE subscription_id = p_subscription_id AND feature_type = 'risk_analysis';

  UPDATE public.subscription_usage
  SET usage_limit = (v_limits->>'saved_credits_limit')::int, updated_at = now()
  WHERE subscription_id = p_subscription_id AND feature_type = 'saved_credits';

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

-- 4. Create/replace admin_extend_subscription RPC
CREATE OR REPLACE FUNCTION public.admin_extend_subscription(
  p_subscription_id uuid,
  p_expires_at timestamptz,
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
BEGIN
  UPDATE public.subscriptions
  SET expires_at = p_expires_at, status = 'active', updated_at = now()
  WHERE id = p_subscription_id
  RETURNING * INTO v_updated_subscription;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id, description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_extend', 'subscription', p_subscription_id, p_user_id,
      'Abonelik süresi ' || p_expires_at::text || ' tarihine uzatıldı',
      jsonb_build_object('expiresAt', p_expires_at)
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
    RAISE EXCEPTION 'Subscription extend failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.admin_create_subscription IS 'Atomically create subscription with usage records and admin logging.';
COMMENT ON FUNCTION public.admin_update_subscription IS 'Atomically update subscription plan and usage limits.';
COMMENT ON FUNCTION public.admin_extend_subscription IS 'Atomically extend subscription expiry date.';
