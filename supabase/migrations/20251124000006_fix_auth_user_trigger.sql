-- =====================================================
-- FIX AUTH USER TRIGGER - CREATE PROFILE ON SIGNUP
-- =====================================================
-- This migration creates the missing trigger on auth.users
-- to automatically create profiles when users sign up
--
-- Issue: on_auth_user_created trigger doesn't exist on auth.users
-- Solution: Create the trigger to call handle_new_user() function

BEGIN;

-- =====================================================
-- 1. ENSURE handle_new_user FUNCTION EXISTS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract full name from metadata
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Split full name into first and last name
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(v_full_name, ' ', 1),
    ''
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(substring(v_full_name from length(split_part(v_full_name, ' ', 1)) + 2), ''),
    ''
  );

  -- Insert a new profile for the user
  -- Note: This will trigger other profile triggers (free_tier, notification_preferences)
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, skip
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but allow user creation to continue
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. DROP AND RECREATE TRIGGER ON AUTH.USERS
-- =====================================================

-- Drop if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. CREATE MISSING PROFILES FOR EXISTING USERS
-- =====================================================

-- Insert profiles for any users that don't have them
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'first_name',
    split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email), ' ', 1),
    ''
  ) as first_name,
  COALESCE(
    u.raw_user_meta_data->>'last_name',
    NULLIF(substring(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') from
      length(split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1)) + 2), ''),
    ''
  ) as last_name,
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check trigger exists on auth.users
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Check that all users have profiles
SELECT
  COUNT(u.id) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(u.id) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- =====================================================
-- EXPECTED RESULT
-- =====================================================
-- Trigger query should return 1 row showing the trigger exists
-- Users query should show users_without_profiles = 0
--
-- After this migration:
-- 1. New user signups will automatically create profiles
-- 2. Profile creation will trigger free_tier and notification_preferences
-- 3. All existing users will have profiles
-- 4. User registration will work without database errors
