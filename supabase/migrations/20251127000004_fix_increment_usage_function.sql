-- Fix increment_usage function - Add limit check for free users
-- Premium users: unlimited, Free users: limited usage

-- First drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.increment_usage(UUID, TEXT);

-- Create the increment_usage function with limit checking
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage RECORD;
  v_limit_count INT;
  v_is_premium BOOLEAN DEFAULT FALSE;
BEGIN
  -- Check if user has active premium subscription
  SELECT EXISTS(
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.plan_type IN ('premium-monthly', 'premium-yearly')
      AND s.status = 'active'
  ) INTO v_is_premium;

  -- Set limits based on feature type and subscription status
  v_limit_count := CASE
    WHEN v_is_premium THEN
      CASE p_feature_type
        WHEN 'ocr_analysis' THEN 999999
        WHEN 'risk_analysis' THEN 999999
        ELSE 5
      END
    ELSE
      CASE p_feature_type
        WHEN 'ocr_analysis' THEN 3 -- Free users: 3 OCR analysis
        WHEN 'risk_analysis' THEN 1 -- Free users: 1 risk analysis
        ELSE 2
      END
  END;

  -- Check if record exists
  SELECT * INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND feature_type = p_feature_type;

  -- FOR FREE USERS: Check if limit is reached
  IF NOT v_is_premium AND v_current_usage IS NOT NULL THEN
    IF v_current_usage.used_count >= v_limit_count THEN
      -- Limit reached, don't increment
      RETURN FALSE;
    END IF;
  END IF;

  IF v_current_usage IS NOT NULL THEN
    -- Update existing record - increment used_count by 1
    UPDATE usage_tracking
    SET
      used_count = used_count + 1,
      limit_count = v_limit_count,
      updated_at = NOW(),
      reset_at = CASE
        WHEN reset_at <= NOW() THEN NOW() + INTERVAL '30 days'
        ELSE reset_at
      END
    WHERE user_id = p_user_id AND feature_type = p_feature_type;

    RETURN TRUE;
  ELSE
    -- Insert new record with used_count = 1
    INSERT INTO usage_tracking (
      user_id,
      feature_type,
      used_count,
      limit_count,
      saved_credits_count,
      reset_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_feature_type,
      1, -- Start with 1 usage
      v_limit_count,
      0,
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    );

    RETURN TRUE;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'increment_usage failed for user %, feature %: %', p_user_id, p_feature_type, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID, TEXT) TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.increment_usage(UUID, TEXT) IS
'Increments the usage count for a specific feature type and user.
Creates a new record if none exists, or increments existing used_count by 1.
Used for tracking OCR analysis and risk analysis usage statistics.';