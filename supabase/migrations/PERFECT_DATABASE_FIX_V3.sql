-- =====================================================
-- PERFECT DATABASE FIX V3 - Ambiguous Column Fixed
-- =====================================================
-- Created: 2025-11-25
-- Purpose: Fix user registration trigger for kreditakip.com.tr

-- =====================================================
-- PHASE 1: ANALYZE CURRENT STATE
-- =====================================================

DO $$
DECLARE
  v_auth_trigger_count INTEGER;
  v_profiles_trigger_count INTEGER;
  v_users_count INTEGER;
  v_profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_auth_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

  SELECT COUNT(*) INTO v_profiles_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND t.tgname IN ('create_default_notification_preferences_trigger', 'on_user_created_initialize_free_tier');

  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRE-FIX DATABASE STATE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'auth.users trigger exists: %', CASE WHEN v_auth_trigger_count > 0 THEN 'YES ✓' ELSE 'NO ✗ (PROBLEM!)' END;
  RAISE NOTICE 'profiles triggers exist: % of 2', v_profiles_trigger_count;
  RAISE NOTICE 'Total auth users: %', v_users_count;
  RAISE NOTICE 'Total profiles: %', v_profiles_count;
  RAISE NOTICE 'Missing profiles: %', v_users_count - v_profiles_count;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 2: CLEANUP
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =====================================================
-- PHASE 3: CREATE HANDLE_NEW_USER FUNCTION
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
BEGIN
  RAISE LOG 'handle_new_user: Processing user % (email: %)', NEW.id, NEW.email;

  -- Extract full name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    split_part(NEW.email, '@', 1)
  );

  -- Parse first and last name
  IF position(' ' in v_full_name) > 0 THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  ELSE
    v_first_name := v_full_name;
    v_last_name := NULL;
  END IF;

  -- Ensure first name is not empty
  IF v_first_name IS NULL OR trim(v_first_name) = '' THEN
    v_first_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Create profile
  -- This triggers:
  -- 1. create_default_notification_preferences_trigger
  -- 2. on_user_created_initialize_free_tier
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
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
    'light',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    updated_at = NOW();

  RAISE LOG 'handle_new_user: SUCCESS for user % (name: % %)', NEW.email, v_first_name, v_last_name;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR for user % - % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Kullanıcı profili oluşturulamadı: %. Lütfen destek ekibiyle iletişime geçin.', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =====================================================
-- PHASE 4: CREATE AUTH TRIGGER
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PHASE 5: FIX EXISTING USERS
-- =====================================================

DO $$
DECLARE
  v_created_profiles INTEGER := 0;
  v_created_prefs INTEGER := 0;
  v_created_usage INTEGER := 0;
BEGIN
  RAISE NOTICE 'Fixing existing users...';

  -- Create missing profiles
  WITH inserted AS (
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      theme,
      is_admin,
      created_at,
      updated_at
    )
    SELECT
      au.id,
      au.email,
      CASE
        WHEN position(' ' in COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        )) > 0
        THEN split_part(COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        ), ' ', 1)
        ELSE COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        )
      END,
      CASE
        WHEN position(' ' in COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        )) > 0
        THEN substring(COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        ) from position(' ' in COALESCE(
          au.raw_user_meta_data->>'full_name',
          au.raw_user_meta_data->>'name',
          split_part(au.email, '@', 1)
        )) + 1)
        ELSE NULL
      END,
      'light',
      false,
      au.created_at,
      NOW()
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
      true, true, true, true,
      false, false,
      true, false,
      '09:00:00'::time,
      NOW(), NOW()
    FROM public.profiles p
    LEFT JOIN public.notification_preferences np ON np.user_id = p.id
    WHERE np.id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_prefs FROM inserted;

  -- Create missing usage_tracking (fixed ambiguous column)
  WITH inserted AS (
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
    SELECT
      p.id,
      features.feature_type,  -- Explicitly specify features.feature_type
      0, 3, 0,
      NOW() + interval '30 days',
      NOW(), NOW()
    FROM public.profiles p
    CROSS JOIN (VALUES ('ocr_analysis'), ('risk_analysis')) AS features(feature_type)
    LEFT JOIN public.usage_tracking ut ON ut.user_id = p.id AND ut.feature_type = features.feature_type
    WHERE ut.id IS NULL
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_usage FROM inserted;

  RAISE NOTICE '✓ Fixed existing users:';
  RAISE NOTICE '  - Created % profiles', v_created_profiles;
  RAISE NOTICE '  - Created % notification preferences', v_created_prefs;
  RAISE NOTICE '  - Created % usage tracking records', v_created_usage;
END $$;

-- =====================================================
-- PHASE 6: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_auth_trigger INTEGER;
  v_profiles_trigger_prefs INTEGER;
  v_profiles_trigger_tier INTEGER;
  v_users_count INTEGER;
  v_profiles_count INTEGER;
  v_prefs_count INTEGER;
  v_usage_count INTEGER;
  v_missing_profiles INTEGER;
  v_missing_prefs INTEGER;
  v_missing_usage INTEGER;
  v_all_good BOOLEAN;
BEGIN
  -- Check triggers
  SELECT COUNT(*) INTO v_auth_trigger
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

  SELECT COUNT(*) INTO v_profiles_trigger_prefs
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND t.tgname = 'create_default_notification_preferences_trigger';

  SELECT COUNT(*) INTO v_profiles_trigger_tier
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND t.tgname = 'on_user_created_initialize_free_tier';

  -- Count records
  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_prefs_count FROM public.notification_preferences;
  SELECT COUNT(*) INTO v_usage_count FROM public.usage_tracking;

  -- Check missing
  SELECT COUNT(*) INTO v_missing_profiles
  FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id WHERE p.id IS NULL;

  SELECT COUNT(*) INTO v_missing_prefs
  FROM public.profiles p LEFT JOIN public.notification_preferences np ON np.user_id = p.id WHERE np.id IS NULL;

  SELECT COUNT(*) INTO v_missing_usage
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM public.usage_tracking ut WHERE ut.user_id = p.id AND ut.feature_type = 'ocr_analysis');

  v_all_good := (v_auth_trigger > 0 AND v_profiles_trigger_prefs > 0 AND v_profiles_trigger_tier > 0
                 AND v_missing_profiles = 0 AND v_missing_prefs = 0 AND v_missing_usage = 0);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'POST-FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGERS:';
  RAISE NOTICE '  auth.users → handle_new_user: %', CASE WHEN v_auth_trigger > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '  profiles → notification_prefs: %', CASE WHEN v_profiles_trigger_prefs > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '  profiles → usage_tracking: %', CASE WHEN v_profiles_trigger_tier > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'DATA INTEGRITY:';
  RAISE NOTICE '  Total users: %', v_users_count;
  RAISE NOTICE '  Total profiles: %', v_profiles_count;
  RAISE NOTICE '  Total notification prefs: %', v_prefs_count;
  RAISE NOTICE '  Total usage tracking: %', v_usage_count;
  RAISE NOTICE '';
  RAISE NOTICE 'MISSING RECORDS:';
  RAISE NOTICE '  Users without profiles: %', v_missing_profiles;
  RAISE NOTICE '  Profiles without prefs: %', v_missing_prefs;
  RAISE NOTICE '  Profiles without usage: %', v_missing_usage;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  IF v_all_good THEN
    RAISE NOTICE '✓✓✓ SUCCESS! DATABASE IS PERFECT! ✓✓✓';
    RAISE NOTICE 'User registration will now work flawlessly.';
  ELSE
    RAISE WARNING 'Some issues remain. Review the report above.';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Trigger status
SELECT
  'TRIGGER STATUS' as check_type,
  t.tgname as trigger_name,
  n.nspname || '.' || c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled WHEN 'O' THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (
  (n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created')
  OR
  (n.nspname = 'public' AND c.relname = 'profiles' AND t.tgname IN (
    'create_default_notification_preferences_trigger',
    'on_user_created_initialize_free_tier'
  ))
)
ORDER BY n.nspname, c.relname, t.tgname;

-- Data summary
SELECT
  'DATA SUMMARY' as check_type,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.notification_preferences) as total_prefs,
  (SELECT COUNT(DISTINCT user_id) FROM public.usage_tracking) as users_with_usage;

-- Integrity check
SELECT
  'INTEGRITY CHECK' as check_type,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id WHERE p.id IS NULL) as users_without_profiles,
  (SELECT COUNT(*) FROM public.profiles p LEFT JOIN public.notification_preferences np ON np.user_id = p.id WHERE np.id IS NULL) as profiles_without_prefs,
  (SELECT COUNT(*) FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.usage_tracking ut WHERE ut.user_id = p.id AND ut.feature_type = 'ocr_analysis')) as profiles_without_usage;

-- Recent profiles
SELECT
  'RECENT PROFILES' as check_type,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  EXISTS(SELECT 1 FROM notification_preferences WHERE user_id = p.id) as has_prefs,
  EXISTS(SELECT 1 FROM usage_tracking WHERE user_id = p.id) as has_usage,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;
