-- =====================================================
-- UPDATE FREE TIER LIMITS
-- =====================================================
-- Purpose:
-- 1. Update initialize_free_tier function with new limits
-- 2. Update existing free tier users with new limits
--
-- New Free Tier Logic:
-- - OCR PDF Analysis: 1 saved record (unlimited analysis)
-- - Risk Analysis: 0 (not available for free tier)
-- =====================================================

-- =====================================================
-- PHASE 1: CHECK CURRENT STATE
-- =====================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_ocr_users INTEGER;
  v_risk_users INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_total_users FROM usage_tracking;
  SELECT COUNT(*) INTO v_ocr_users FROM usage_tracking WHERE feature_type = 'ocr_analysis';
  SELECT COUNT(*) INTO v_risk_users FROM usage_tracking WHERE feature_type = 'risk_analysis';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT FREE TIER STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users with tracking: %', v_total_users;
  RAISE NOTICE 'OCR analysis records: %', v_ocr_users;
  RAISE NOTICE 'Risk analysis records: %', v_risk_users;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 2: UPDATE initialize_free_tier FUNCTION
-- =====================================================

-- Drop and recreate with new limits
DROP FUNCTION IF EXISTS public.initialize_free_tier() CASCADE;

CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE LOG 'initialize_free_tier: Creating usage tracking for user %', NEW.id;

  -- Create OCR analysis tracking (1 saved record, unlimited analysis)
  -- Note: limit_count = 1 means user can save 1 PDF analysis result
  -- The unlimited analysis is handled in application logic
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
    1,  -- Changed from 3 to 1
    0,
    NOW() + interval '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    limit_count = 1,
    updated_at = NOW();

  -- Create risk analysis tracking (0 for free tier - not available)
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
    0,  -- Changed from 3 to 0 (not available for free tier)
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
    -- Don't re-raise - we don't want to block profile creation
    RETURN NEW;
END;
$$;

-- Grant permissions
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
-- PHASE 4: UPDATE EXISTING FREE TIER USERS
-- =====================================================

DO $$
DECLARE
  v_updated_ocr INTEGER := 0;
  v_updated_risk INTEGER := 0;
  v_premium_users INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATING EXISTING FREE TIER USERS';
  RAISE NOTICE '========================================';

  -- Count premium users (we'll skip them)
  SELECT COUNT(DISTINCT p.id) INTO v_premium_users
  FROM profiles p
  JOIN subscriptions s ON s.user_id = p.id
  WHERE s.status = 'active' AND s.plan_type = 'premium';

  RAISE NOTICE 'Premium users to skip: %', v_premium_users;

  -- Update OCR analysis limit to 1 for free tier users only
  -- Free tier = users without active premium subscription
  WITH updated_ocr AS (
    UPDATE public.usage_tracking ut
    SET
      limit_count = 1,
      updated_at = NOW()
    WHERE ut.feature_type = 'ocr_analysis'
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = ut.user_id
          AND s.status = 'active'
          AND s.plan_type = 'premium'
      )
      AND ut.limit_count != 1  -- Only update if different
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_updated_ocr FROM updated_ocr;

  RAISE NOTICE '✓ Updated OCR limit to 1 for % free tier users', v_updated_ocr;

  -- Update Risk analysis limit to 0 for free tier users only
  WITH updated_risk AS (
    UPDATE public.usage_tracking ut
    SET
      limit_count = 0,
      updated_at = NOW()
    WHERE ut.feature_type = 'risk_analysis'
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = ut.user_id
          AND s.status = 'active'
          AND s.plan_type = 'premium'
      )
      AND ut.limit_count != 0  -- Only update if different
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_updated_risk FROM updated_risk;

  RAISE NOTICE '✓ Updated Risk limit to 0 for % free tier users', v_updated_risk;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 5: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
  v_free_ocr_limit_1 INTEGER;
  v_free_ocr_limit_other INTEGER;
  v_free_risk_limit_0 INTEGER;
  v_free_risk_limit_other INTEGER;
  v_premium_users INTEGER;
BEGIN
  -- Check trigger exists
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND t.tgname = 'on_user_created_initialize_free_tier';

  -- Count premium users
  SELECT COUNT(DISTINCT s.user_id) INTO v_premium_users
  FROM subscriptions s
  WHERE s.status = 'active' AND s.plan_type = 'premium';

  -- Count free tier users with correct OCR limit (1)
  SELECT COUNT(*) INTO v_free_ocr_limit_1
  FROM usage_tracking ut
  WHERE ut.feature_type = 'ocr_analysis'
    AND ut.limit_count = 1
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id
        AND s.status = 'active'
        AND s.plan_type = 'premium'
    );

  -- Count free tier users with incorrect OCR limit
  SELECT COUNT(*) INTO v_free_ocr_limit_other
  FROM usage_tracking ut
  WHERE ut.feature_type = 'ocr_analysis'
    AND ut.limit_count != 1
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id
        AND s.status = 'active'
        AND s.plan_type = 'premium'
    );

  -- Count free tier users with correct Risk limit (0)
  SELECT COUNT(*) INTO v_free_risk_limit_0
  FROM usage_tracking ut
  WHERE ut.feature_type = 'risk_analysis'
    AND ut.limit_count = 0
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id
        AND s.status = 'active'
        AND s.plan_type = 'premium'
    );

  -- Count free tier users with incorrect Risk limit
  SELECT COUNT(*) INTO v_free_risk_limit_other
  FROM usage_tracking ut
  WHERE ut.feature_type = 'risk_analysis'
    AND ut.limit_count != 0
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id
        AND s.status = 'active'
        AND s.plan_type = 'premium'
    );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'FREE TIER UPDATE - VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGER STATUS:';
  RAISE NOTICE '  profiles → initialize_free_tier: %',
    CASE WHEN v_trigger_count > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'SUBSCRIPTION TIERS:';
  RAISE NOTICE '  Premium users: %', v_premium_users;
  RAISE NOTICE '';
  RAISE NOTICE 'FREE TIER OCR ANALYSIS:';
  RAISE NOTICE '  Users with limit = 1: % ✓', v_free_ocr_limit_1;
  RAISE NOTICE '  Users with incorrect limit: % %',
    v_free_ocr_limit_other,
    CASE WHEN v_free_ocr_limit_other > 0 THEN '❌' ELSE '' END;
  RAISE NOTICE '';
  RAISE NOTICE 'FREE TIER RISK ANALYSIS:';
  RAISE NOTICE '  Users with limit = 0: % ✓', v_free_risk_limit_0;
  RAISE NOTICE '  Users with incorrect limit: % %',
    v_free_risk_limit_other,
    CASE WHEN v_free_risk_limit_other > 0 THEN '❌' ELSE '' END;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  IF v_trigger_count > 0 AND v_free_ocr_limit_other = 0 AND v_free_risk_limit_other = 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS! FREE TIER LIMITS UPDATED! ✓✓✓';
    RAISE NOTICE 'Free tier: OCR = 1 saved record, Risk = 0';
    RAISE NOTICE 'New users will automatically get these limits.';
  ELSE
    RAISE WARNING 'Some issues remain. Check the report above.';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show free tier users with their new limits
SELECT
  'FREE TIER USERS' as info,
  p.email,
  p.first_name,
  ut.feature_type,
  ut.used_count,
  ut.limit_count,
  ut.saved_credits_count,
  (ut.limit_count - ut.used_count + ut.saved_credits_count) as available,
  DATE(ut.reset_at) as reset_date
FROM profiles p
JOIN usage_tracking ut ON ut.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.user_id = p.id
    AND s.status = 'active'
    AND s.plan_type = 'premium'
)
ORDER BY p.created_at DESC, ut.feature_type
LIMIT 20;

-- Show premium users (should keep their original limits)
SELECT
  'PREMIUM USERS' as info,
  p.email,
  p.first_name,
  s.plan_type,
  ut.feature_type,
  ut.used_count,
  ut.limit_count,
  ut.saved_credits_count,
  (ut.limit_count - ut.used_count + ut.saved_credits_count) as available
FROM profiles p
JOIN subscriptions s ON s.user_id = p.id
JOIN usage_tracking ut ON ut.user_id = p.id
WHERE s.status = 'active' AND s.plan_type = 'premium'
ORDER BY p.created_at DESC, ut.feature_type
LIMIT 10;

-- Summary by feature type
SELECT
  'LIMITS SUMMARY' as info,
  ut.feature_type,
  ut.limit_count,
  COUNT(*) as user_count,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = ut.user_id
        AND s.status = 'active'
        AND s.plan_type = 'premium'
    ) THEN 'premium'
    ELSE 'free'
  END as tier
FROM usage_tracking ut
GROUP BY ut.feature_type, ut.limit_count, tier
ORDER BY tier, feature_type, limit_count;
