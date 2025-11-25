-- =====================================================
-- FIX PROFILE CREATION WITH CORRECT STRUCTURE
-- =====================================================
-- Match actual table structure: first_name, last_name instead of full_name
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- 1. FIX HANDLE_NEW_USER - USE CORRECT COLUMNS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract name from metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Split full name into first and last
  IF position(' ' in v_full_name) > 0 THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  ELSE
    v_first_name := v_full_name;
    v_last_name := NULL;
  END IF;

  -- Create profile with correct structure
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    updated_at = NOW();

  -- Note: notification_preferences and usage_tracking will be created
  -- automatically by triggers on profiles table:
  -- - create_default_notification_preferences_trigger
  -- - on_user_created_initialize_free_tier

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Critical error - fail the user creation to debug
  RAISE EXCEPTION 'Profile creation failed for user %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 2. ENSURE TRIGGER EXISTS ON auth.users
-- =====================================================

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. FIX INITIALIZE_FREE_TIER TRIGGER (profiles)
-- =====================================================

-- This runs when profile is created
CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  -- Create usage tracking entries
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

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail profile creation, just log
  RAISE WARNING 'Failed to initialize free tier for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 4. CREATE MISSING PROFILES FOR EXISTING USERS
-- =====================================================

DO $$
DECLARE
  v_user RECORD;
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Loop through users without profiles
  FOR v_user IN
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.updated_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Extract name
    v_full_name := COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.email);

    -- Split name
    IF position(' ' in v_full_name) > 0 THEN
      v_first_name := split_part(v_full_name, ' ', 1);
      v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
    ELSE
      v_first_name := v_full_name;
      v_last_name := NULL;
    END IF;

    -- Create profile
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      created_at,
      updated_at
    )
    VALUES (
      v_user.id,
      v_user.email,
      v_first_name,
      v_last_name,
      v_user.created_at,
      v_user.updated_at
    )
    ON CONFLICT (id) DO NOTHING;

    -- Triggers will handle the rest (notification_preferences, usage_tracking)
  END LOOP;

  RAISE NOTICE 'Completed creating missing profiles';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check users without profiles
-- SELECT
--   au.id,
--   au.email,
--   au.created_at,
--   p.id IS NOT NULL as has_profile,
--   np.user_id IS NOT NULL as has_notifications,
--   ut.user_id IS NOT NULL as has_usage_tracking
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- LEFT JOIN public.notification_preferences np ON np.user_id = au.id
-- LEFT JOIN public.usage_tracking ut ON ut.user_id = au.id AND ut.feature_type = 'ocr_analysis'
-- ORDER BY au.created_at DESC
-- LIMIT 20;

-- Check recent profiles
-- SELECT
--   id,
--   email,
--   first_name,
--   last_name,
--   created_at
-- FROM public.profiles
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Check usage tracking
-- SELECT
--   user_id,
--   feature_type,
--   saved_credits_count,
--   limit_count
-- FROM public.usage_tracking
-- ORDER BY created_at DESC
-- LIMIT 20;
