-- =====================================================
-- MASTER DATABASE FIX - Complete Database Reset & Fix
-- =====================================================
-- Created: 2025-11-25
-- Purpose: Fix all database inconsistencies and auth triggers
-- Run this in Supabase SQL Editor

-- =====================================================
-- PHASE 1: CLEANUP - Remove ALL conflicting triggers/functions
-- =====================================================

BEGIN;

-- Drop all existing auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created ON auth.users CASCADE;

-- Drop all old functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.initialize_free_tier() CASCADE;
DROP FUNCTION IF EXISTS public.on_user_created_initialize_free_tier() CASCADE;

COMMIT;

-- =====================================================
-- PHASE 2: TABLE STRUCTURE VERIFICATION
-- =====================================================

BEGIN;

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscription_tier TEXT DEFAULT 'free' NOT NULL,
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  credits_remaining INTEGER DEFAULT 3 NOT NULL,
  total_credits_used INTEGER DEFAULT 0 NOT NULL,
  last_credit_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  CONSTRAINT valid_credits CHECK (credits_remaining >= 0),
  CONSTRAINT valid_total_credits CHECK (total_credits_used >= 0)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure subscription_tiers table exists
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  monthly_credits INTEGER NOT NULL,
  price_monthly NUMERIC(10,2),
  price_yearly NUMERIC(10,2),
  features JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_tier_name CHECK (tier_name IN ('free', 'basic', 'premium', 'enterprise'))
);

-- Ensure notification_preferences table exists
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  payment_reminder_days INTEGER DEFAULT 3,
  weekly_report BOOLEAN DEFAULT false,
  monthly_report BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =====================================================
-- PHASE 3: RLS POLICIES - Clean & Recreate
-- =====================================================

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;

-- =====================================================
-- PHASE 4: INITIALIZE SUBSCRIPTION TIERS DATA
-- =====================================================

BEGIN;

-- Clear and repopulate subscription tiers
TRUNCATE public.subscription_tiers CASCADE;

INSERT INTO public.subscription_tiers (tier_name, monthly_credits, price_monthly, price_yearly, features)
VALUES
  ('free', 3, 0, 0, '["3 aylık ücretsiz kredi", "Temel özellikler"]'::JSONB),
  ('basic', 50, 49.90, 479.00, '["50 aylık kredi", "Tüm temel özellikler", "Öncelikli destek"]'::JSONB),
  ('premium', 200, 149.90, 1439.00, '["200 aylık kredi", "Tüm özellikler", "Öncelikli destek", "Gelişmiş raporlar"]'::JSONB),
  ('enterprise', -1, NULL, NULL, '["Sınırsız kredi", "Özel çözümler", "Dedicated support"]'::JSONB)
ON CONFLICT (tier_name) DO UPDATE SET
  monthly_credits = EXCLUDED.monthly_credits,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features;

COMMIT;

-- =====================================================
-- PHASE 5: CORE FUNCTIONS
-- =====================================================

BEGIN;

-- =====================================================
-- Function 1: handle_new_user - Main auth trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_profile_id UUID;
BEGIN
  -- Log start
  RAISE LOG 'handle_new_user: Starting for user % (email: %)', NEW.id, NEW.email;

  -- Extract and parse name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Split name into first and last
  IF position(' ' in v_full_name) > 0 THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  ELSE
    v_first_name := v_full_name;
    v_last_name := NULL;
  END IF;

  -- Insert profile with proper defaults
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    subscription_tier,
    subscription_status,
    credits_remaining,
    total_credits_used,
    last_credit_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    'free',
    'active',
    3,
    0,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING id INTO v_profile_id;

  RAISE LOG 'handle_new_user: Profile created for user % with ID %', NEW.email, v_profile_id;

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    email_notifications,
    payment_reminders,
    payment_reminder_days,
    weekly_report,
    monthly_report,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    3,
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'handle_new_user: Notification preferences created for user %', NEW.email;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error
    RAISE LOG 'handle_new_user ERROR for user % (email: %): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;

    -- Re-raise to block signup and show error to user
    RAISE EXCEPTION 'Failed to create user profile: %. Please contact support.', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMIT;

-- =====================================================
-- PHASE 6: CREATE AUTH TRIGGER
-- =====================================================

BEGIN;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE 'SUCCESS: Auth trigger created successfully';

COMMIT;

-- =====================================================
-- PHASE 7: FIX EXISTING USERS WITHOUT PROFILES
-- =====================================================

BEGIN;

-- Create profiles for existing users without them
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  subscription_tier,
  subscription_status,
  credits_remaining,
  total_credits_used,
  last_credit_reset_at,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) > 0
    THEN split_part(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)), ' ', 1)
    ELSE COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
  END as first_name,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) > 0
    THEN substring(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) from position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) + 1)
    ELSE NULL
  END as last_name,
  'free',
  'active',
  3,
  0,
  NOW(),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create notification preferences for users without them
INSERT INTO public.notification_preferences (
  user_id,
  email_notifications,
  payment_reminders,
  payment_reminder_days,
  weekly_report,
  monthly_report,
  created_at,
  updated_at
)
SELECT
  p.id,
  true,
  true,
  3,
  false,
  false,
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.notification_preferences np ON np.user_id = p.id
WHERE np.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- =====================================================
-- PHASE 8: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
  v_users_without_profiles INTEGER;
  v_profiles_without_prefs INTEGER;
BEGIN
  -- Check trigger exists
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

  IF v_trigger_count = 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: Trigger not found!';
  END IF;

  -- Check users without profiles
  SELECT COUNT(*) INTO v_users_without_profiles
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL;

  -- Check profiles without preferences
  SELECT COUNT(*) INTO v_profiles_without_prefs
  FROM public.profiles p
  LEFT JOIN public.notification_preferences np ON np.user_id = p.id
  WHERE np.id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE FIX VERIFICATION RESULTS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Auth trigger exists: YES';
  RAISE NOTICE 'Users without profiles: %', v_users_without_profiles;
  RAISE NOTICE 'Profiles without preferences: %', v_profiles_without_prefs;
  RAISE NOTICE '========================================';

  IF v_users_without_profiles > 0 OR v_profiles_without_prefs > 0 THEN
    RAISE WARNING 'Some users are missing profiles or preferences. Check logs.';
  ELSE
    RAISE NOTICE 'SUCCESS: All users have profiles and preferences!';
  END IF;
END $$;

-- =====================================================
-- FINAL CHECK QUERIES
-- =====================================================

-- Show trigger status
SELECT
  'TRIGGER STATUS' as info,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Enabled ✓'
    WHEN 'D' THEN 'Disabled ✗'
    ELSE 'Unknown'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- Show users without profiles (should be empty)
SELECT
  'USERS WITHOUT PROFILES (Should be 0)' as info,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Show recent profiles
SELECT
  'RECENT PROFILES' as info,
  id,
  email,
  first_name,
  subscription_tier,
  credits_remaining,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Show subscription tiers
SELECT
  'SUBSCRIPTION TIERS' as info,
  tier_name,
  monthly_credits,
  price_monthly
FROM public.subscription_tiers
ORDER BY
  CASE tier_name
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 2
    WHEN 'premium' THEN 3
    WHEN 'enterprise' THEN 4
  END;
