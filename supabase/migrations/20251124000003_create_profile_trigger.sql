-- =====================================================
-- CREATE PROFILE AUTO-CREATION TRIGGER
-- =====================================================
-- This migration creates a trigger to automatically create
-- a profile when a new user signs up via Supabase Auth
--
-- Issue: Users don't have profiles after signing up
-- Solution: Create trigger on auth.users to auto-create profile

BEGIN;

-- =====================================================
-- 1. CREATE FUNCTION TO HANDLE NEW USER
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
    split_part(v_full_name, ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(substring(v_full_name from length(split_part(v_full_name, ' ', 1)) + 2), '')
  );

  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER ON AUTH.USERS
-- =====================================================

-- Drop if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. CREATE MISSING PROFILES FOR EXISTING USERS
-- =====================================================

-- Find users without profiles and create them
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'first_name',
    split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email), ' ', 1)
  ) as first_name,
  COALESCE(
    u.raw_user_meta_data->>'last_name',
    NULLIF(substring(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') from
      length(split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1)) + 2), '')
  ) as last_name,
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that all users have profiles
SELECT
  COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Should return 0

-- =====================================================
-- EXPECTED RESULT
-- =====================================================
-- After this migration:
-- 1. All existing users will have profiles
-- 2. New users will automatically get profiles when they sign up
-- 3. Profile will be created with:
--    - id: same as auth.users.id
--    - email: from auth.users.email
--    - first_name: from metadata or parsed from full_name
--    - last_name: from metadata or parsed from full_name
--    - avatar_url: from metadata (avatar_url or picture)
--    - created_at/updated_at: current timestamp
