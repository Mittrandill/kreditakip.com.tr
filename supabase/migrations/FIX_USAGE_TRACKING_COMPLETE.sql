-- =====================================================
-- FIX USAGE TRACKING COMPLETE
-- =====================================================
-- Purpose:
-- 1. Fix/recreate initialize_free_tier trigger
-- 2. Create usage_tracking for all users without it

-- =====================================================
-- PHASE 1: CHECK CURRENT STATE
-- =====================================================

DO $$
DECLARE
  v_profiles_count INTEGER;
  v_profiles_with_usage INTEGER;
  v_profiles_without_usage INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;

  SELECT COUNT(DISTINCT user_id) INTO v_profiles_with_usage FROM usage_tracking;

  SELECT COUNT(*) INTO v_profiles_without_usage
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM usage_tracking ut WHERE ut.user_id = p.id
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'USAGE TRACKING STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', v_profiles_count;
  RAISE NOTICE 'Profiles with usage tracking: %', v_profiles_with_usage;
  RAISE NOTICE 'Profiles WITHOUT usage tracking: % ❌', v_profiles_without_usage;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 2: RECREATE/FIX initialize_free_tier FUNCTION
-- =====================================================

-- Drop old versions
DROP FUNCTION IF EXISTS public.initialize_free_tier(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_free_tier() CASCADE;

-- Create the trigger function (no parameters, uses NEW from trigger)
CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE LOG 'initialize_free_tier: Creating usage tracking for user %', NEW.id;

  -- Create OCR analysis tracking (3 free per month)
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
    0,
    3,
    0,
    NOW() + interval '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Create risk analysis tracking (3 free per month)
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
    3,
    0,
    NOW() + interval '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE LOG 'initialize_free_tier: SUCCESS for user %', NEW.id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'initialize_free_tier ERROR for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
    -- Don't re-raise - we don't want to block profile creation
    RETURN NEW;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_free_tier() TO postgres;
GRANT EXECUTE ON FUNCTION public.initialize_free_tier() TO service_role;

-- =====================================================
-- PHASE 3: RECREATE TRIGGER ON PROFILES
-- =====================================================

DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON public.profiles;

CREATE TRIGGER on_user_created_initialize_free_tier
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_free_tier();

-- =====================================================
-- PHASE 4: CREATE USAGE TRACKING FOR EXISTING USERS
-- =====================================================

DO $$
DECLARE
  v_created_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Creating usage tracking for existing users...';

  -- Create usage tracking for all profiles without it
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
      features.feature_type,
      0,
      3,
      0,
      NOW() + interval '30 days',
      NOW(),
      NOW()
    FROM public.profiles p
    CROSS JOIN (
      VALUES ('ocr_analysis'), ('risk_analysis')
    ) AS features(feature_type)
    LEFT JOIN public.usage_tracking ut
      ON ut.user_id = p.id AND ut.feature_type = features.feature_type
    WHERE ut.id IS NULL
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created_count FROM inserted;

  RAISE NOTICE '✓ Created % usage tracking records', v_created_count;
END $$;

-- =====================================================
-- PHASE 5: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
  v_profiles_count INTEGER;
  v_profiles_with_usage INTEGER;
  v_profiles_without_usage INTEGER;
  v_ocr_tracking INTEGER;
  v_risk_tracking INTEGER;
BEGIN
  -- Check trigger exists
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND t.tgname = 'on_user_created_initialize_free_tier';

  -- Count profiles
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;

  SELECT COUNT(DISTINCT user_id) INTO v_profiles_with_usage FROM usage_tracking;

  SELECT COUNT(*) INTO v_profiles_without_usage
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM usage_tracking ut WHERE ut.user_id = p.id
  );

  -- Count tracking types
  SELECT COUNT(*) INTO v_ocr_tracking
  FROM usage_tracking WHERE feature_type = 'ocr_analysis';

  SELECT COUNT(*) INTO v_risk_tracking
  FROM usage_tracking WHERE feature_type = 'risk_analysis';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'USAGE TRACKING FIX - VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGER STATUS:';
  RAISE NOTICE '  profiles → initialize_free_tier: %',
    CASE WHEN v_trigger_count > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'DATA INTEGRITY:';
  RAISE NOTICE '  Total profiles: %', v_profiles_count;
  RAISE NOTICE '  Profiles with usage tracking: %', v_profiles_with_usage;
  RAISE NOTICE '  Profiles WITHOUT usage tracking: %', v_profiles_without_usage;
  RAISE NOTICE '';
  RAISE NOTICE 'TRACKING RECORDS:';
  RAISE NOTICE '  OCR analysis tracking: %', v_ocr_tracking;
  RAISE NOTICE '  Risk analysis tracking: %', v_risk_tracking;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  IF v_trigger_count > 0 AND v_profiles_without_usage = 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS! ALL USERS HAVE USAGE TRACKING! ✓✓✓';
    RAISE NOTICE 'New users will automatically get free tier limits.';
  ELSE
    RAISE WARNING 'Some issues remain. Check the report above.';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show trigger status
SELECT
  'TRIGGER STATUS' as info,
  t.tgname as trigger_name,
  n.nspname || '.' || c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled WHEN 'O' THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND t.tgname = 'on_user_created_initialize_free_tier';

-- Show usage tracking summary
SELECT
  'USAGE TRACKING SUMMARY' as info,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(DISTINCT user_id) FROM usage_tracking) as profiles_with_tracking,
  (SELECT COUNT(*) FROM usage_tracking WHERE feature_type = 'ocr_analysis') as ocr_tracking_records,
  (SELECT COUNT(*) FROM usage_tracking WHERE feature_type = 'risk_analysis') as risk_tracking_records;

-- Show users without usage tracking (should be empty)
SELECT
  'USERS WITHOUT TRACKING' as info,
  p.id,
  p.email,
  p.first_name,
  p.created_at,
  COUNT(ut.id) as tracking_count
FROM profiles p
LEFT JOIN usage_tracking ut ON ut.user_id = p.id
GROUP BY p.id, p.email, p.first_name, p.created_at
HAVING COUNT(ut.id) = 0
ORDER BY p.created_at DESC
LIMIT 5;

-- Show recent users with their limits
SELECT
  'RECENT USERS WITH LIMITS' as info,
  p.email,
  p.first_name,
  ut.feature_type,
  ut.used_count,
  ut.limit_count,
  ut.saved_credits_count,
  (ut.limit_count - ut.used_count + ut.saved_credits_count) as available_credits,
  DATE(ut.reset_at) as reset_date
FROM profiles p
JOIN usage_tracking ut ON ut.user_id = p.id
ORDER BY p.created_at DESC, ut.feature_type
LIMIT 10;
