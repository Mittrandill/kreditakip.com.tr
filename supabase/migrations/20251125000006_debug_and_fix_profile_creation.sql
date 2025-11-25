-- =====================================================
-- DEBUG AND FIX PROFILE CREATION
-- =====================================================
-- Ensure trigger is properly attached and profile creation works
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- 1. CHECK AND RECREATE TRIGGER
-- =====================================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- 2. FIX HANDLE_NEW_USER - REMOVE EXCEPTION SWALLOWING
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Create profile (MUST succeed)
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Create notification preferences
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE WARNING 'Failed to create notification preferences for user %: %', NEW.id, v_error_message;
  END;

  -- Initialize free tier (with error handling)
  BEGIN
    -- Try new version with saved_credits_count
    INSERT INTO public.usage_tracking (
      user_id,
      feature_type,
      used_count,
      saved_credits_count,
      limit_count,
      reset_at
    )
    VALUES
      (NEW.id, 'ocr_analysis', 0, 0, 1, NOW() + INTERVAL '30 days'),
      (NEW.id, 'risk_analysis', 0, 0, 0, NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id, feature_type) DO NOTHING;
  EXCEPTION WHEN undefined_column THEN
    -- Fallback: If saved_credits_count doesn't exist yet, use old structure
    BEGIN
      INSERT INTO public.usage_tracking (
        user_id,
        feature_type,
        used_count,
        limit_count,
        reset_at
      )
      VALUES
        (NEW.id, 'ocr_analysis', 0, 1, NOW() + INTERVAL '30 days'),
        (NEW.id, 'risk_analysis', 0, 0, NOW() + INTERVAL '30 days')
      ON CONFLICT (user_id, feature_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      v_error_message := SQLERRM;
      RAISE WARNING 'Failed to initialize free tier for user % (fallback): %', NEW.id, v_error_message;
    END;
  WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE WARNING 'Failed to initialize free tier for user %: %', NEW.id, v_error_message;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail user creation
  v_error_message := SQLERRM;
  RAISE WARNING 'CRITICAL: handle_new_user failed for user %: %', NEW.id, v_error_message;
  RAISE EXCEPTION 'Profile creation failed: %', v_error_message;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 3. RECREATE TRIGGER
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. CREATE MISSING PROFILES FOR EXISTING USERS
-- =====================================================

-- Find users without profiles and create them
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create missing notification preferences
INSERT INTO public.notification_preferences (
  user_id,
  email_enabled,
  push_enabled,
  payment_reminders,
  overdue_alerts,
  marketing_emails
)
SELECT
  au.id,
  true,
  true,
  true,
  true,
  false
FROM auth.users au
LEFT JOIN public.notification_preferences np ON np.user_id = au.id
WHERE np.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create missing usage tracking
INSERT INTO public.usage_tracking (
  user_id,
  feature_type,
  used_count,
  saved_credits_count,
  limit_count,
  reset_at
)
SELECT
  au.id,
  'ocr_analysis',
  0,
  0,
  1,
  NOW() + INTERVAL '30 days'
FROM auth.users au
LEFT JOIN public.usage_tracking ut ON ut.user_id = au.id AND ut.feature_type = 'ocr_analysis'
WHERE ut.user_id IS NULL
ON CONFLICT (user_id, feature_type) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check trigger exists
-- SELECT
--   tgname as trigger_name,
--   tgenabled as enabled,
--   pg_get_triggerdef(oid) as trigger_definition
-- FROM pg_trigger
-- WHERE tgname = 'on_auth_user_created';

-- Check users without profiles
-- SELECT
--   au.id,
--   au.email,
--   au.created_at,
--   CASE WHEN p.id IS NULL THEN '❌ Missing' ELSE '✅ Exists' END as profile_status
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- ORDER BY au.created_at DESC
-- LIMIT 10;

-- Check recent profiles
-- SELECT * FROM public.profiles
-- ORDER BY created_at DESC
-- LIMIT 10;
