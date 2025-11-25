-- =====================================================
-- FIX FUNCTION SEARCH PATH SECURITY WARNINGS
-- =====================================================
-- Add search_path protection to all functions
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- 1. FIX CAN_USE_FEATURE
-- =====================================================

CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN
SET search_path = ''
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
BEGIN
  -- Check if user has premium subscription
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type = 'premium'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- Premium users have unlimited access
  IF v_subscription.id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Check usage limits for free users
  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
  LIMIT 1;

  -- No usage record = can use (will be created on first save)
  IF v_usage.id IS NULL THEN
    RETURN true;
  END IF;

  -- For OCR: Check saved_credits_count instead of used_count
  IF p_feature_type = 'ocr_analysis' THEN
    RETURN v_usage.saved_credits_count < v_usage.limit_count;
  END IF;

  -- For other features: Check used_count
  RETURN v_usage.used_count < v_usage.limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 2. FIX GET_OCR_SAVE_COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION get_ocr_save_count(p_user_id UUID)
RETURNS INT
SET search_path = ''
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COALESCE(saved_credits_count, 0) INTO v_count
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = 'ocr_analysis'
  LIMIT 1;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 3. FIX INCREMENT_USAGE
-- =====================================================

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN
SET search_path = ''
AS $$
DECLARE
  v_limit INT;
BEGIN
  -- Set limits based on feature type
  v_limit := CASE p_feature_type
    WHEN 'ocr_analysis' THEN 1
    WHEN 'risk_analysis' THEN 3
    ELSE 5
  END;

  -- Insert or update usage
  INSERT INTO public.usage_tracking (user_id, feature_type, used_count, saved_credits_count, limit_count, reset_at)
  VALUES (
    p_user_id,
    p_feature_type,
    0,
    1,
    v_limit,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    saved_credits_count = public.usage_tracking.saved_credits_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 4. FIX INITIALIZE_FREE_TIER
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_free_tier(p_user_id UUID)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  -- Insert default usage tracking for free tier features
  INSERT INTO public.usage_tracking (user_id, feature_type, used_count, saved_credits_count, limit_count, reset_at)
  VALUES
    (p_user_id, 'ocr_analysis', 0, 0, 1, NOW() + INTERVAL '30 days'),
    (p_user_id, 'risk_analysis', 0, 0, 0, NOW() + INTERVAL '30 days')
  ON CONFLICT (user_id, feature_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 5. FIX HANDLE_NEW_USER
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    payment_reminders,
    overdue_alerts,
    marketing_emails,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize free tier
  PERFORM public.initialize_free_tier(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 6. FIX CREATE_DEFAULT_NOTIFICATION_PREFERENCES
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    payment_reminders,
    overdue_alerts,
    marketing_emails
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 7. FIX UPDATE_UPDATED_AT_COLUMN
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check search_path is set for all functions
-- SELECT
--   p.proname as function_name,
--   pg_get_function_result(p.oid) as return_type,
--   CASE
--     WHEN p.proconfig IS NULL THEN 'NOT SET ⚠️'
--     WHEN 'search_path=' || ANY(p.proconfig) THEN 'SET ✅'
--     ELSE 'NOT SET ⚠️'
--   END as search_path_status
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'can_use_feature',
--     'get_ocr_save_count',
--     'increment_usage',
--     'initialize_free_tier',
--     'handle_new_user',
--     'create_default_notification_preferences',
--     'update_updated_at_column'
--   )
-- ORDER BY p.proname;
