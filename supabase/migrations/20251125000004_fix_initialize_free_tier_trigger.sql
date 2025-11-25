-- =====================================================
-- FIX INITIALIZE_FREE_TIER TRIGGER FUNCTION
-- =====================================================
-- Add search_path to trigger version
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- FIX TRIGGER VERSION (no parameters)
-- =====================================================

CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  -- Create usage tracking entry for free tier with new saved_credits_count column
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    saved_credits_count,
    limit_count,
    reset_at
  )
  VALUES (
    NEW.id,
    'ocr_analysis',
    0,
    0,  -- Start with 0 saved credits
    1,  -- Free tier limit
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to initialize free tier for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ALSO FIX MANUAL VERSION (with parameter)
-- =====================================================

CREATE OR REPLACE FUNCTION public.initialize_free_tier(p_user_id UUID)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  -- Insert default usage tracking for free tier features
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    saved_credits_count,
    limit_count,
    reset_at
  )
  VALUES
    (p_user_id, 'ocr_analysis', 0, 0, 1, NOW() + INTERVAL '30 days'),
    (p_user_id, 'risk_analysis', 0, 0, 0, NOW() + INTERVAL '30 days')
  ON CONFLICT (user_id, feature_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check both versions have search_path set
-- SELECT
--   p.proname as function_name,
--   pg_get_function_arguments(p.oid) as arguments,
--   pg_get_function_result(p.oid) as return_type,
--   CASE
--     WHEN 'search_path=' = ANY(p.proconfig::text[]) THEN '✅ Korumalı'
--     ELSE '⚠️ Korumasız'
--   END as search_path_status
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname = 'initialize_free_tier'
-- ORDER BY pg_get_function_arguments(p.oid);
