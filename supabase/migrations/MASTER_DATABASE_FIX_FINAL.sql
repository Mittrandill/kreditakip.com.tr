-- =====================================================
-- MASTER DATABASE FIX FINAL - Complete Database Reset & Fix
-- =====================================================
-- Created: 2025-11-25
-- Purpose: Fix all database inconsistencies with dynamic column detection
-- Run this in Supabase SQL Editor

-- =====================================================
-- PHASE 1: CLEANUP - Remove ALL conflicting triggers/functions
-- =====================================================

DO $$
BEGIN
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

  RAISE NOTICE '✓ Phase 1 Complete: Old triggers and functions removed';
END $$;

-- =====================================================
-- PHASE 2: FIX PROFILES TABLE STRUCTURE
-- =====================================================

DO $$
BEGIN
  -- subscription_tier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' NOT NULL;
    RAISE NOTICE '✓ Added subscription_tier column';
  END IF;

  -- subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'active';
    RAISE NOTICE '✓ Added subscription_status column';
  END IF;

  -- trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
    RAISE NOTICE '✓ Added trial_ends_at column';
  END IF;

  -- stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    RAISE NOTICE '✓ Added stripe_customer_id column';
  END IF;

  -- stripe_subscription_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
    RAISE NOTICE '✓ Added stripe_subscription_id column';
  END IF;

  -- credits_remaining
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits_remaining'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN credits_remaining INTEGER DEFAULT 3 NOT NULL;
    RAISE NOTICE '✓ Added credits_remaining column';
  END IF;

  -- total_credits_used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_credits_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_credits_used INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE '✓ Added total_credits_used column';
  END IF;

  -- last_credit_reset_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_credit_reset_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_credit_reset_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✓ Added last_credit_reset_at column';
  END IF;

  RAISE NOTICE '✓ Phase 2 Complete: Profiles table structure updated';
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_stripe_customer_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_stripe_subscription_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_tier') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_subscription_tier
    CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_credits') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_credits CHECK (credits_remaining >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_total_credits') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_total_credits CHECK (total_credits_used >= 0);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 3: FIX NOTIFICATION PREFERENCES TABLE
-- =====================================================

-- First, check if table exists, if not create it
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing columns dynamically
DO $$
BEGIN
  -- email_notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    RAISE NOTICE '✓ Added email_notifications column';
  END IF;

  -- payment_reminders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'payment_reminders'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN payment_reminders BOOLEAN DEFAULT true;
    RAISE NOTICE '✓ Added payment_reminders column';
  END IF;

  -- payment_reminder_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'payment_reminder_days'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN payment_reminder_days INTEGER DEFAULT 3;
    RAISE NOTICE '✓ Added payment_reminder_days column';
  END IF;

  -- weekly_report
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'weekly_report'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN weekly_report BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added weekly_report column';
  END IF;

  -- monthly_report
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'monthly_report'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN monthly_report BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Added monthly_report column';
  END IF;

  RAISE NOTICE '✓ Phase 3 Complete: Notification preferences table updated';
END $$;

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 4: ENSURE SUBSCRIPTION TIERS TABLE
-- =====================================================

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

-- =====================================================
-- PHASE 5: RLS POLICIES
-- =====================================================

DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
  DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
  DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
  DROP POLICY IF EXISTS "Enable read access for own notifications" ON public.notification_preferences;
  DROP POLICY IF EXISTS "Enable insert access for own notifications" ON public.notification_preferences;
  DROP POLICY IF EXISTS "Enable update access for own notifications" ON public.notification_preferences;
END $$;

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

-- =====================================================
-- PHASE 6: INITIALIZE SUBSCRIPTION TIERS
-- =====================================================

DELETE FROM public.subscription_tiers;

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

-- =====================================================
-- PHASE 7: CREATE HANDLE_NEW_USER FUNCTION
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
  RAISE LOG 'handle_new_user: Starting for user % (email: %)', NEW.id, NEW.email;

  -- Extract and parse name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

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

  RAISE LOG 'handle_new_user: Profile created for user %', NEW.email;

  -- Create notification preferences
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
    RAISE LOG 'handle_new_user ERROR for user % (email: %): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to create user profile: %. Please contact support.', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- PHASE 8: CREATE AUTH TRIGGER
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PHASE 9: UPDATE EXISTING DATA
-- =====================================================

DO $$
BEGIN
  -- Update existing profiles
  UPDATE public.profiles
  SET
    subscription_tier = COALESCE(subscription_tier, 'free'),
    subscription_status = COALESCE(subscription_status, 'active'),
    credits_remaining = COALESCE(credits_remaining, 3),
    total_credits_used = COALESCE(total_credits_used, 0),
    last_credit_reset_at = COALESCE(last_credit_reset_at, NOW()),
    updated_at = NOW()
  WHERE subscription_tier IS NULL
     OR credits_remaining IS NULL
     OR total_credits_used IS NULL;

  -- Update email from auth.users if missing
  UPDATE public.profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.id = au.id AND (p.email IS NULL OR p.email = '');

  RAISE NOTICE '✓ Phase 9: Existing profiles updated';
END $$;

-- =====================================================
-- PHASE 10: CREATE MISSING PROFILES & PREFERENCES
-- =====================================================

DO $$
DECLARE
  v_created_profiles INTEGER := 0;
  v_created_prefs INTEGER := 0;
BEGIN
  -- Create missing profiles
  WITH inserted AS (
    INSERT INTO public.profiles (
      id, email, first_name, last_name, subscription_tier, subscription_status,
      credits_remaining, total_credits_used, last_credit_reset_at, created_at, updated_at
    )
    SELECT
      au.id,
      au.email,
      CASE
        WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) > 0
        THEN split_part(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)), ' ', 1)
        ELSE COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
      END,
      CASE
        WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) > 0
        THEN substring(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) from position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))) + 1)
        ELSE NULL
      END,
      'free', 'active', 3, 0, NOW(), au.created_at, NOW()
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_profiles FROM inserted;

  -- Create missing notification preferences
  WITH inserted AS (
    INSERT INTO public.notification_preferences (
      user_id, email_notifications, payment_reminders, payment_reminder_days,
      weekly_report, monthly_report, created_at, updated_at
    )
    SELECT p.id, true, true, 3, false, false, NOW(), NOW()
    FROM public.profiles p
    LEFT JOIN public.notification_preferences np ON np.user_id = p.id
    WHERE np.id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_prefs FROM inserted;

  RAISE NOTICE '✓ Phase 10: Created % profiles and % notification preferences', v_created_profiles, v_created_prefs;
END $$;

-- =====================================================
-- PHASE 11: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
  v_users_without_profiles INTEGER;
  v_profiles_without_prefs INTEGER;
  v_profiles_count INTEGER;
  v_users_count INTEGER;
BEGIN
  -- Check trigger
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

  IF v_trigger_count = 0 THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: Trigger not found!';
  END IF;

  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;

  SELECT COUNT(*) INTO v_users_without_profiles
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL;

  SELECT COUNT(*) INTO v_profiles_without_prefs
  FROM public.profiles p
  LEFT JOIN public.notification_preferences np ON np.user_id = p.id
  WHERE np.id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Auth trigger: ACTIVE';
  RAISE NOTICE '✓ Total users: %', v_users_count;
  RAISE NOTICE '✓ Total profiles: %', v_profiles_count;
  RAISE NOTICE '✓ Users without profiles: %', v_users_without_profiles;
  RAISE NOTICE '✓ Profiles without preferences: %', v_profiles_without_prefs;
  RAISE NOTICE '========================================';

  IF v_users_without_profiles = 0 AND v_profiles_without_prefs = 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS! Database is fully configured! ✓✓✓';
  ELSE
    RAISE WARNING 'Some users are missing profiles or preferences';
  END IF;
END $$;

-- =====================================================
-- FINAL QUERIES
-- =====================================================

-- Trigger status
SELECT
  'TRIGGER STATUS' as check_type,
  t.tgname as trigger_name,
  CASE t.tgenabled WHEN 'O' THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

-- Table summaries
SELECT 'DATA SUMMARY' as check_type,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.notification_preferences) as total_preferences,
  (SELECT COUNT(*) FROM public.subscription_tiers) as total_tiers;

-- Recent profiles
SELECT 'RECENT PROFILES' as check_type, id, email, first_name, subscription_tier, credits_remaining
FROM public.profiles
ORDER BY created_at DESC
LIMIT 3;
