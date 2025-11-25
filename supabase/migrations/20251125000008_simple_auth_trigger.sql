-- =====================================================
-- SIMPLE AUTH TRIGGER - GUARANTEED TO WORK
-- =====================================================
-- Minimal trigger to create profiles
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- 1. DROP ALL CONFLICTING TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users CASCADE;

-- =====================================================
-- 2. SIMPLE HANDLE_NEW_USER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Log start
  RAISE LOG 'handle_new_user: Starting for user %', NEW.id;

  -- Extract name
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);

  -- Split name
  IF position(' ' in v_full_name) > 0 THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  ELSE
    v_first_name := v_full_name;
    v_last_name := NULL;
  END IF;

  -- Insert profile
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
    updated_at = NOW();

  RAISE LOG 'handle_new_user: Profile created for user %', NEW.id;

  -- Triggers on profiles table will handle the rest:
  -- - create_default_notification_preferences_trigger
  -- - on_user_created_initialize_free_tier

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'handle_new_user ERROR for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise to block signup and force debugging
    RAISE;
END;
$$;

-- =====================================================
-- 3. CREATE TRIGGER ON auth.users
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. VERIFY TRIGGER EXISTS
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

  IF v_trigger_count = 0 THEN
    RAISE EXCEPTION 'TRIGGER CREATION FAILED! on_auth_user_created not found on auth.users';
  ELSE
    RAISE NOTICE 'SUCCESS: Trigger on_auth_user_created exists on auth.users';
  END IF;
END $$;

-- =====================================================
-- 5. CREATE MISSING PROFILES
-- =====================================================

INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.email)) > 0
    THEN split_part(COALESCE(au.raw_user_meta_data->>'full_name', au.email), ' ', 1)
    ELSE COALESCE(au.raw_user_meta_data->>'full_name', au.email)
  END as first_name,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.email)) > 0
    THEN substring(COALESCE(au.raw_user_meta_data->>'full_name', au.email) from position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.email)) + 1)
    ELSE NULL
  END as last_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check trigger
SELECT
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- Check users without profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  p.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
