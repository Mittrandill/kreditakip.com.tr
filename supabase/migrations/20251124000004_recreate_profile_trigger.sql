-- =====================================================
-- RECREATE PROFILE TRIGGER (FIX DATABASE ERROR)
-- =====================================================
-- This migration drops and recreates the profile trigger
-- without created_at and updated_at columns
--
-- Issue: Trigger was trying to insert created_at/updated_at
--        but these columns either don't exist or have default values
--
-- Solution: Only insert required columns

BEGIN;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- CREATE CORRECTED FUNCTION
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
  -- Note: created_at and updated_at have DEFAULT now() so we don't need to specify them
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_first_name, ''),  -- Ensure NOT NULL
    COALESCE(v_last_name, ''),   -- Ensure NOT NULL
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE MISSING PROFILES FOR EXISTING USERS
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
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors

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
-- 1. Trigger will work without created_at/updated_at
-- 2. User registration will succeed
-- 3. Profiles will be created automatically
-- 4. All existing users will have profiles
