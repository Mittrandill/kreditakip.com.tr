-- =====================================================
-- FIX USAGE TRACKING AND NOTIFICATION PREFERENCES
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

-- =====================================================
-- PHASE 1: CHECK CURRENT STATE
-- =====================================================

DO $$
DECLARE
  v_profiles_count INTEGER;
  v_with_usage INTEGER;
  v_with_notifications INTEGER;
  v_without_notifications INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO v_with_usage FROM usage_tracking;
  SELECT COUNT(DISTINCT user_id) INTO v_with_notifications FROM notification_preferences;

  SELECT COUNT(*) INTO v_without_notifications
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT STATE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', v_profiles_count;
  RAISE NOTICE 'Profiles with usage tracking: %', v_with_usage;
  RAISE NOTICE 'Profiles with notifications: %', v_with_notifications;
  RAISE NOTICE 'Profiles WITHOUT notifications: % ❌', v_without_notifications;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 2: UPDATE initialize_free_tier FUNCTION
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

-- =====================================================
-- PHASE 3: RECREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON public.profiles;

CREATE TRIGGER on_user_created_initialize_free_tier
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_free_tier();

-- =====================================================
-- PHASE 4: UPDATE handle_new_user TO CREATE NOTIFICATIONS
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

-- =====================================================
-- PHASE 5: RECREATE TRIGGER ON auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PHASE 6: UPDATE EXISTING USAGE TRACKING
-- =====================================================

DO $$
DECLARE
  v_updated_ocr INTEGER := 0;
  v_updated_risk INTEGER := 0;
BEGIN
  RAISE NOTICE 'Updating existing usage tracking records...';

  -- Update OCR: Reset saved_credits_count to 0 for all free users
  -- This ensures consistent starting point
  WITH updated_ocr AS (
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
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_updated_ocr FROM updated_ocr;

  RAISE NOTICE '✓ Updated % OCR tracking records', v_updated_ocr;

  -- Update Risk: Set to 0 for free users
  WITH updated_risk AS (
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
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_updated_risk FROM updated_risk;

  RAISE NOTICE '✓ Updated % Risk tracking records', v_updated_risk;
END $$;

-- =====================================================
-- PHASE 7: CREATE MISSING NOTIFICATION PREFERENCES
-- =====================================================

DO $$
DECLARE
  v_created_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Creating notification preferences for users without them...';

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
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_count FROM inserted;

  RAISE NOTICE '✓ Created % notification preferences', v_created_count;
END $$;

-- =====================================================
-- PHASE 8: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_auth_trigger INTEGER;
  v_profile_trigger INTEGER;
  v_profiles_count INTEGER;
  v_with_usage INTEGER;
  v_with_notifications INTEGER;
  v_without_notifications INTEGER;
  v_free_ocr_correct INTEGER;
  v_free_risk_correct INTEGER;
BEGIN
  -- Check triggers
  SELECT COUNT(*) INTO v_auth_trigger
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

  SELECT COUNT(*) INTO v_profile_trigger
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND t.tgname = 'on_user_created_initialize_free_tier';

  -- Count users
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO v_with_usage FROM usage_tracking;
  SELECT COUNT(DISTINCT user_id) INTO v_with_notifications FROM notification_preferences;

  SELECT COUNT(*) INTO v_without_notifications
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id
  );

  -- Count correct free tier settings
  SELECT COUNT(*) INTO v_free_ocr_correct
  FROM usage_tracking ut
  WHERE ut.feature_type = 'ocr_analysis'
    AND ut.limit_count = 1
    AND ut.saved_credits_count = 0
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id AND s.status = 'active' AND s.plan_type = 'premium'
    );

  SELECT COUNT(*) INTO v_free_risk_correct
  FROM usage_tracking ut
  WHERE ut.feature_type = 'risk_analysis'
    AND ut.limit_count = 0
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id AND s.status = 'active' AND s.plan_type = 'premium'
    );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGERS:';
  RAISE NOTICE '  auth.users → handle_new_user: %',
    CASE WHEN v_auth_trigger > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '  profiles → initialize_free_tier: %',
    CASE WHEN v_profile_trigger > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'DATA INTEGRITY:';
  RAISE NOTICE '  Total profiles: %', v_profiles_count;
  RAISE NOTICE '  With usage tracking: %', v_with_usage;
  RAISE NOTICE '  With notifications: %', v_with_notifications;
  RAISE NOTICE '  WITHOUT notifications: %', v_without_notifications;
  RAISE NOTICE '';
  RAISE NOTICE 'FREE TIER SETTINGS:';
  RAISE NOTICE '  OCR (limit=1, saved=0): % users ✓', v_free_ocr_correct;
  RAISE NOTICE '  Risk (limit=0): % users ✓', v_free_risk_correct;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  IF v_auth_trigger > 0 AND v_profile_trigger > 0 AND v_without_notifications = 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS! ALL SYSTEMS READY! ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Free Tier Logic:';
    RAISE NOTICE '  - OCR: Unlimited analysis, 1 save';
    RAISE NOTICE '  - Risk: Not available (premium only)';
    RAISE NOTICE '  - Notifications: Auto-created';
  ELSE
    RAISE WARNING 'Some issues remain. Check report above.';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show trigger status
SELECT
  'TRIGGERS' as info,
  t.tgname as trigger_name,
  n.nspname || '.' || c.relname as on_table,
  p.proname as function_name,
  CASE t.tgenabled WHEN 'O' THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (
  (n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created')
  OR
  (n.nspname = 'public' AND c.relname = 'profiles' AND t.tgname = 'on_user_created_initialize_free_tier')
);

-- Show users without notifications (should be empty)
SELECT
  'MISSING NOTIFICATIONS' as info,
  p.id,
  p.email,
  p.first_name,
  p.created_at
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id
)
ORDER BY p.created_at DESC
LIMIT 5;

-- Show recent users with their settings
SELECT
  'RECENT USERS' as info,
  p.email,
  p.first_name,
  ut.feature_type,
  ut.saved_credits_count as saved,
  ut.limit_count as max_saves,
  (ut.limit_count - ut.saved_credits_count) as remaining,
  CASE WHEN np.id IS NOT NULL THEN '✓' ELSE '✗' END as has_notifications
FROM profiles p
LEFT JOIN usage_tracking ut ON ut.user_id = p.id
LEFT JOIN notification_preferences np ON np.user_id = p.id
ORDER BY p.created_at DESC
LIMIT 10;
