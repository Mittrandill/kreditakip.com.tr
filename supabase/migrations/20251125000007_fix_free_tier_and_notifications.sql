-- =====================================================
-- FIX FREE TIER LIMITS AND NOTIFICATION PREFERENCES
-- =====================================================
-- Purpose:
-- 1. Update usage tracking logic for save credits
-- 2. Fix handle_new_user to create notification_preferences
-- 3. Backfill missing notification preferences
--
-- Free Tier Logic:
-- - OCR: Unlimited analysis, 1 saved record (saved_credits_count tracks saves)
-- - Risk: 0 (not available)
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: UPDATE initialize_free_tier FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.initialize_free_tier() CASCADE;

CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE LOG 'initialize_free_tier: Creating usage tracking for user %', NEW.id;

  -- OCR Analysis: saved_credits_count starts at 0, limit is 1
  -- User can analyze unlimited times, but can only SAVE 1 PDF
  -- When user clicks "Krediyi Kaydet": saved_credits_count increments 0→1
  -- Second save attempt: saved_credits_count (1) >= limit_count (1) → Show premium prompt
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    limit_count,
    saved_credits_count,
    reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'ocr_analysis',
    0,                                    -- Not used for tracking saves
    1,                                    -- Max 1 save for free tier
    0,                                    -- Starts at 0, increments on save
    NOW() + interval '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    limit_count = 1,
    saved_credits_count = 0,              -- Reset for consistency
    updated_at = NOW();

  -- Risk Analysis: 0 for free tier (not available)
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    limit_count,
    saved_credits_count,
    reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'risk_analysis',
    0,
    0,                                    -- Not available for free tier
    0,
    NOW() + interval '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    limit_count = 0,
    saved_credits_count = 0,
    updated_at = NOW();

  RAISE LOG 'initialize_free_tier: SUCCESS for user %', NEW.id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'initialize_free_tier ERROR for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_free_tier() TO postgres;
GRANT EXECUTE ON FUNCTION public.initialize_free_tier() TO service_role;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON public.profiles;

CREATE TRIGGER on_user_created_initialize_free_tier
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_free_tier();

-- =====================================================
-- PART 2: UPDATE handle_new_user TO CREATE NOTIFICATIONS
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  RAISE LOG 'handle_new_user: Processing user % (email: %)', NEW.id, NEW.email;

  -- Extract user data from metadata
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    theme,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_phone,
    'light',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  RAISE LOG 'handle_new_user: Profile created for %', NEW.email;

  -- Create notification preferences (all enabled by default except SMS)
  INSERT INTO public.notification_preferences (
    user_id,
    email_3_days_before,
    email_1_day_before,
    email_on_due_date,
    email_overdue,
    sms_1_day_before,
    sms_on_due_date,
    email_enabled,
    sms_enabled,
    notification_time,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,       -- email_3_days_before
    true,       -- email_1_day_before
    true,       -- email_on_due_date
    true,       -- email_overdue
    false,      -- sms_1_day_before (SMS disabled by default)
    false,      -- sms_on_due_date
    true,       -- email_enabled
    false,      -- sms_enabled
    '09:00:00', -- notification_time
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'handle_new_user: Notification preferences created for %', NEW.email;
  RAISE LOG 'handle_new_user: SUCCESS for %', NEW.email;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user ERROR for %: % (SQLSTATE: %)',
      NEW.email, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 3: UPDATE EXISTING USAGE TRACKING
-- =====================================================

-- Update OCR: Reset saved_credits_count to 0 for all free users
UPDATE public.usage_tracking ut
SET
  limit_count = 1,
  saved_credits_count = 0,  -- Reset to 0
  used_count = 0,            -- Reset to 0
  updated_at = NOW()
WHERE ut.feature_type = 'ocr_analysis'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = ut.user_id
      AND s.status = 'active'
      AND s.plan_type = 'premium'
  );

-- Update Risk: Set to 0 for free users
UPDATE public.usage_tracking ut
SET
  limit_count = 0,
  saved_credits_count = 0,
  used_count = 0,
  updated_at = NOW()
WHERE ut.feature_type = 'risk_analysis'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = ut.user_id
      AND s.status = 'active'
      AND s.plan_type = 'premium'
  );

-- =====================================================
-- PART 4: CREATE MISSING NOTIFICATION PREFERENCES
-- =====================================================

INSERT INTO public.notification_preferences (
  user_id,
  email_3_days_before,
  email_1_day_before,
  email_on_due_date,
  email_overdue,
  sms_1_day_before,
  sms_on_due_date,
  email_enabled,
  sms_enabled,
  notification_time,
  created_at,
  updated_at
)
SELECT
  p.id,
  true,       -- email_3_days_before
  true,       -- email_1_day_before
  true,       -- email_on_due_date
  true,       -- email_overdue
  false,      -- sms_1_day_before
  false,      -- sms_on_due_date
  true,       -- email_enabled
  false,      -- sms_enabled
  '09:00:00', -- notification_time
  NOW(),
  NOW()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
