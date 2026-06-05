-- ============================================================================
-- BUGFIX + SECURITY: usage functions targeted a dropped table
-- Date: 2026-06-06
--
-- increment_usage, increment_saved_credits and can_use_feature still read/wrote
-- the `usage_tracking` table, which was dropped. Effects in production:
--   * increment_usage caught the error and returned FALSE -> risk-analysis API
--     returned "limit exceeded" 403 for EVERYONE, including premium.
--   * increment_saved_credits threw -> misleading error on credit save.
--   * can_use_feature always returned TRUE -> free 1-save limit not enforced.
--
-- Rewritten to use the live `subscription_usage` table. Added an auth.uid()
-- ownership guard (service_role bypasses) which also closes IDOR on these RPCs.
--
-- Limits: risk_analysis  free 0 / pro 5 / premium unlimited
--         saved credits  free 1 / pro 10 / premium unlimited
--         ocr_analysis usage is unlimited (statistics only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_feature_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_type text;
  v_subscription_id uuid;
  v_limit int;
  v_is_premium boolean;
  v_usage public.subscription_usage%ROWTYPE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.id, s.plan_type INTO v_subscription_id, v_plan_type
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active' AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC LIMIT 1;

  v_plan_type := COALESCE(v_plan_type, 'free');
  v_is_premium := (v_plan_type = 'premium');

  v_limit := CASE
    WHEN v_plan_type = 'premium' THEN 999999
    WHEN v_plan_type = 'pro' THEN
      CASE p_feature_type WHEN 'risk_analysis' THEN 5 WHEN 'ocr_analysis' THEN 10 ELSE 5 END
    ELSE
      CASE p_feature_type WHEN 'risk_analysis' THEN 0 WHEN 'ocr_analysis' THEN 999999 ELSE 0 END
  END;

  SELECT * INTO v_usage FROM public.subscription_usage
  WHERE user_id = p_user_id AND feature_type = p_feature_type;

  IF v_usage.user_id IS NOT NULL THEN
    IF NOT v_is_premium AND v_usage.usage_count >= v_limit THEN
      RETURN false;
    END IF;
    UPDATE public.subscription_usage
    SET usage_count = usage_count + 1,
        limit_count = v_limit,
        updated_at = now(),
        reset_at = CASE WHEN reset_at <= now() THEN now() + interval '30 days' ELSE reset_at END
    WHERE user_id = p_user_id AND feature_type = p_feature_type;
    RETURN true;
  ELSE
    IF NOT v_is_premium AND v_limit <= 0 THEN
      RETURN false;
    END IF;
    INSERT INTO public.subscription_usage
      (user_id, subscription_id, feature_type, usage_count, limit_count,
       saved_credits_count, saved_credits_limit, reset_at, created_at, updated_at)
    VALUES
      (p_user_id, v_subscription_id, p_feature_type, 1, v_limit,
       0, 0, now() + interval '30 days', now(), now())
    ON CONFLICT (user_id, feature_type) DO UPDATE
      SET usage_count = public.subscription_usage.usage_count + 1,
          limit_count = v_limit,
          updated_at = now();
    RETURN true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_saved_credits(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_type text;
  v_subscription_id uuid;
  v_limit int;
  v_is_premium boolean;
  v_usage public.subscription_usage%ROWTYPE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.id, s.plan_type INTO v_subscription_id, v_plan_type
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active' AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC LIMIT 1;

  v_plan_type := COALESCE(v_plan_type, 'free');
  v_is_premium := (v_plan_type = 'premium');
  v_limit := CASE v_plan_type WHEN 'premium' THEN 999999 WHEN 'pro' THEN 10 ELSE 1 END;

  SELECT * INTO v_usage FROM public.subscription_usage
  WHERE user_id = p_user_id AND feature_type = 'ocr_analysis';

  IF v_usage.user_id IS NOT NULL THEN
    IF NOT v_is_premium AND v_usage.saved_credits_count >= v_limit THEN
      RETURN false;
    END IF;
    UPDATE public.subscription_usage
    SET saved_credits_count = saved_credits_count + 1,
        saved_credits_limit = v_limit,
        updated_at = now()
    WHERE user_id = p_user_id AND feature_type = 'ocr_analysis';
    RETURN true;
  ELSE
    INSERT INTO public.subscription_usage
      (user_id, subscription_id, feature_type, usage_count, limit_count,
       saved_credits_count, saved_credits_limit, reset_at, created_at, updated_at)
    VALUES
      (p_user_id, v_subscription_id, 'ocr_analysis', 0, 999999,
       1, v_limit, now() + interval '30 days', now(), now())
    ON CONFLICT (user_id, feature_type) DO UPDATE
      SET saved_credits_count = public.subscription_usage.saved_credits_count + 1,
          saved_credits_limit = v_limit,
          updated_at = now();
    RETURN true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id uuid, p_feature_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_type text;
  v_is_premium boolean;
  v_limit int;
  v_usage public.subscription_usage%ROWTYPE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.plan_type INTO v_plan_type
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active' AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC LIMIT 1;

  v_plan_type := COALESCE(v_plan_type, 'free');
  v_is_premium := (v_plan_type = 'premium');

  IF v_is_premium THEN
    RETURN true;
  END IF;

  IF p_feature_type = 'ocr_analysis' THEN
    v_limit := CASE v_plan_type WHEN 'pro' THEN 10 ELSE 1 END;
    SELECT * INTO v_usage FROM public.subscription_usage
    WHERE user_id = p_user_id AND feature_type = 'ocr_analysis';
    IF v_usage.user_id IS NULL THEN
      RETURN true;
    END IF;
    RETURN v_usage.saved_credits_count < v_limit;
  ELSE
    v_limit := CASE
      WHEN p_feature_type = 'risk_analysis' THEN CASE v_plan_type WHEN 'pro' THEN 5 ELSE 0 END
      ELSE 0
    END;
    SELECT * INTO v_usage FROM public.subscription_usage
    WHERE user_id = p_user_id AND feature_type = p_feature_type;
    IF v_usage.user_id IS NULL THEN
      RETURN v_limit > 0;
    END IF;
    RETURN v_usage.usage_count < v_limit;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_saved_credits(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_use_feature(uuid, text) FROM anon;
