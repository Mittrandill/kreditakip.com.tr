-- =====================================================
-- FIX INCREMENT_USAGE FUNCTION
-- =====================================================
-- Fix duplicate key error and update OCR limit to 1
-- Created: 2025-11-25

BEGIN;

-- Drop and recreate increment_usage function with correct conflict handling
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INT;
BEGIN
  -- Set limits based on feature type
  v_limit := CASE p_feature_type
    WHEN 'ocr_analysis' THEN 1  -- Changed from 3 to 1
    WHEN 'risk_analysis' THEN 3
    ELSE 5
  END;

  -- Insert or update usage - FIX: Use (user_id, feature_type) for conflict
  INSERT INTO usage_tracking (user_id, feature_type, used_count, limit_count, reset_at)
  VALUES (
    p_user_id,
    p_feature_type,
    1,
    v_limit,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type)  -- Changed from (id) to (user_id, feature_type)
  DO UPDATE SET
    used_count = usage_tracking.used_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Grant execute to service_role and authenticated (for preview page save)
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

COMMIT;
