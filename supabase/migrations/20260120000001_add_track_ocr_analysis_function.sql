-- Migration: Add track_ocr_analysis function
-- Purpose: Track OCR analysis count without enforcing limits
-- Reason: OCR analysis should be unlimited, only saving credits should be limited
--
-- This function:
-- 1. Increments usage_count in subscription_usage for statistics
-- 2. Does NOT check limits (unlike increment_usage)
-- 3. Always returns TRUE (success)
-- 4. Creates usage record if doesn't exist (for new users)

CREATE OR REPLACE FUNCTION track_ocr_analysis(
  p_user_id UUID,
  p_feature_type TEXT DEFAULT 'ocr_analysis'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_record RECORD;
BEGIN
  -- Check if usage record exists for this user and feature
  SELECT *
  INTO v_usage_record
  FROM subscription_usage
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type;

  IF v_usage_record IS NULL THEN
    -- Create initial usage record if it doesn't exist
    -- Get the user's subscription to determine initial limits
    INSERT INTO subscription_usage (
      user_id,
      subscription_id,
      feature_type,
      usage_count,
      limit_count,
      saved_credits_count,
      saved_credits_limit,
      reset_at,
      created_at,
      updated_at
    )
    SELECT
      p_user_id,
      s.id,
      p_feature_type,
      1, -- Initial usage count
      CASE
        WHEN s.plan_type = 'premium' THEN 999999
        WHEN s.plan_type = 'pro' THEN 10
        ELSE 1
      END as limit_count,
      0, -- No credits saved yet
      CASE
        WHEN s.plan_type = 'premium' THEN 999999
        WHEN s.plan_type = 'pro' THEN 10
        ELSE 1
      END as saved_credits_limit,
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'canceled', 'paused', 'past_due')
      AND s.deleted_at IS NULL
    ORDER BY
      CASE s.status
        WHEN 'active' THEN 1
        WHEN 'paused' THEN 2
        WHEN 'past_due' THEN 3
        WHEN 'canceled' THEN 4
        ELSE 5
      END,
      s.created_at DESC
    LIMIT 1
    ON CONFLICT (user_id, feature_type) DO NOTHING;

    -- If no subscription found, create with free tier defaults
    IF NOT FOUND THEN
      INSERT INTO subscription_usage (
        user_id,
        feature_type,
        usage_count,
        limit_count,
        saved_credits_count,
        saved_credits_limit,
        reset_at,
        created_at,
        updated_at
      )
      VALUES (
        p_user_id,
        p_feature_type,
        1,
        1, -- Free tier limit
        0,
        1, -- Free tier saved credits limit
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, feature_type) DO NOTHING;
    END IF;
  ELSE
    -- Record exists, just increment usage_count
    UPDATE subscription_usage
    SET
      usage_count = usage_count + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND feature_type = p_feature_type;
  END IF;

  -- Always return TRUE (no limit check)
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the OCR analysis
    RAISE WARNING 'track_ocr_analysis error for user %: %', p_user_id, SQLERRM;
    -- Still return TRUE so analysis continues
    RETURN TRUE;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION track_ocr_analysis(UUID, TEXT) IS
'Tracks OCR analysis usage count for statistics without enforcing limits.
Unlike increment_usage, this function:
- Always returns TRUE (never blocks analysis)
- Only increments usage_count (for statistics/reporting)
- Does not check or enforce limits
- Creates usage record if needed for new users
Used by /api/analyze-pdf to track how many times users analyze PDFs.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION track_ocr_analysis(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_ocr_analysis(UUID, TEXT) TO service_role;
