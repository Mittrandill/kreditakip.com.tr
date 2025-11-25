-- =====================================================
-- ADD SAVED CREDITS TRACKING
-- =====================================================
-- Add saved_credits_count column to track OCR saves separately
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- 1. ADD NEW COLUMN
-- =====================================================

-- Add saved_credits_count column to usage_tracking
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS saved_credits_count INT DEFAULT 0 NOT NULL;

-- Add comment
COMMENT ON COLUMN usage_tracking.saved_credits_count IS 'Number of credits saved with OCR (separate from analysis count)';

-- =====================================================
-- 2. UPDATE EXISTING USERS
-- =====================================================

-- Update all existing users' ocr_analysis limit to 1
UPDATE usage_tracking
SET
  limit_count = 1,
  saved_credits_count = 0,  -- Reset saved credits count
  updated_at = NOW()
WHERE feature_type = 'ocr_analysis';

-- =====================================================
-- 3. UPDATE INCREMENT_USAGE FUNCTION
-- =====================================================

-- Now increment saved_credits_count instead of used_count
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
    WHEN 'ocr_analysis' THEN 1  -- Free users can save 1 credit with OCR
    WHEN 'risk_analysis' THEN 3
    ELSE 5
  END;

  -- Insert or update usage
  INSERT INTO usage_tracking (user_id, feature_type, used_count, saved_credits_count, limit_count, reset_at)
  VALUES (
    p_user_id,
    p_feature_type,
    0,  -- used_count is no longer used for OCR (unlimited analysis)
    1,  -- Increment saved_credits_count
    v_limit,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    saved_credits_count = usage_tracking.saved_credits_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 4. UPDATE CAN_USE_FEATURE FUNCTION
-- =====================================================

-- Check saved_credits_count instead of used_count for OCR
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
BEGIN
  -- Check if user has premium subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type = 'premium'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- Premium users have unlimited access
  IF v_subscription.id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Check usage limits for free users
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
  LIMIT 1;

  -- No usage record = can use (will be created on first save)
  IF v_usage.id IS NULL THEN
    RETURN true;
  END IF;

  -- For OCR: Check saved_credits_count instead of used_count
  IF p_feature_type = 'ocr_analysis' THEN
    RETURN v_usage.saved_credits_count < v_usage.limit_count;
  END IF;

  -- For other features: Check used_count
  RETURN v_usage.used_count < v_usage.limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 5. CREATE HELPER FUNCTION TO GET SAVE COUNT
-- =====================================================

-- Get how many credits user has saved with OCR
CREATE OR REPLACE FUNCTION get_ocr_save_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COALESCE(saved_credits_count, 0) INTO v_count
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = 'ocr_analysis'
  LIMIT 1;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ocr_save_count(UUID) TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all users' OCR limits
-- SELECT user_id, feature_type, used_count, saved_credits_count, limit_count
-- FROM usage_tracking
-- WHERE feature_type = 'ocr_analysis';

-- Check specific user's OCR save count
-- SELECT get_ocr_save_count('your-user-id-here');
