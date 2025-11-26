-- Fix plan type checking in database functions
-- The subscription table stores 'premium' not 'premium-monthly'/'premium-yearly'

-- Fix increment_usage function to check for correct plan type
DROP FUNCTION IF EXISTS public.increment_usage(UUID, TEXT);

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
      AND s.plan_type = 'premium'  -- Check plan_type, not plan_id
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

-- Fix increment_saved_credits function to check for correct plan type
DROP FUNCTION IF EXISTS public.increment_saved_credits(UUID);

CREATE OR REPLACE FUNCTION public.increment_saved_credits(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_is_premium BOOLEAN DEFAULT FALSE;
  v_save_limit INT;
BEGIN
  -- Check if user has premium subscription
  SELECT * INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.plan_type = 'premium'  -- Check plan_type, not plan_id
    AND s.status = 'active'
  LIMIT 1;

  v_is_premium := v_subscription.id IS NOT NULL;

  -- Set save limit based on subscription status
  v_save_limit := CASE
    WHEN v_is_premium THEN 999999 -- Premium: unlimited saves
    ELSE 1 -- Free users: 1 save
  END;

  -- Get current usage for OCR analysis
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND feature_type = 'ocr_analysis'
  LIMIT 1;

  -- If no record exists, create one
  IF v_usage.id IS NULL THEN
    INSERT INTO usage_tracking (
      user_id,
      feature_type,
      used_count,
      saved_credits_count,
      limit_count,
      reset_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      'ocr_analysis',
      0,
      1, -- Start with 1 save
      v_save_limit,
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    );

    RETURN TRUE;
  END IF;

  -- Debug: Log subscription status for troubleshooting
  RAISE LOG 'User: %, Premium: %, Save Limit: %, Current Saves: %',
    p_user_id, v_is_premium, v_save_limit, v_usage.saved_credits_count;

  -- Check if user has reached save limit (only affects free users)
  IF v_usage.saved_credits_count >= v_save_limit THEN
    RAISE LOG 'Save limit reached for user % (premium: %, limit: %, current: %)',
      p_user_id, v_is_premium, v_save_limit, v_usage.saved_credits_count;
    -- Limit reached, don't increment
    RETURN FALSE;
  END IF;

  -- Increment saved_credits_count
  UPDATE usage_tracking
  SET
    saved_credits_count = saved_credits_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
  AND feature_type = 'ocr_analysis';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.increment_saved_credits(UUID) TO authenticated, service_role;

-- Fix can_use_feature function to check for correct plan type
DROP FUNCTION IF EXISTS public.can_use_feature(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_is_premium BOOLEAN DEFAULT FALSE;
BEGIN
  -- Check if user has premium subscription
  SELECT * INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.plan_type = 'premium'  -- Check plan_type, not plan_id
    AND s.status = 'active'
  LIMIT 1;

  v_is_premium := v_subscription.id IS NOT NULL;

  -- Get current usage
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND feature_type = p_feature_type
  LIMIT 1;

  -- No usage record = can use (will be created on first save)
  IF v_usage.id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Premium users have unlimited saves
  IF v_is_premium THEN
    RETURN TRUE;
  END IF;

  -- For OCR SAVES: Check saved_credits_count (1 save for free users)
  IF p_feature_type = 'ocr_analysis' THEN
    RETURN v_usage.saved_credits_count < 1; -- Free users: only 1 save
  END IF;

  -- For other features: Not applicable for can_use_feature (this is for saves only)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.increment_usage(UUID, TEXT) IS
'Increments the usage count for a specific feature type and user.
Creates a new record if none exists, or increments existing used_count by 1.
Used for tracking OCR analysis and risk analysis usage statistics.
Fixed to check for plan_type = ''premium'' instead of specific plan IDs.';

COMMENT ON FUNCTION public.increment_saved_credits(UUID) IS
'Increment saved_credits_count for OCR credit saves.
Premium users: unlimited saves.
Free users: limited to 1 save.
Fixed to check for plan_type = ''premium'' instead of specific plan IDs.';

COMMENT ON FUNCTION public.can_use_feature(UUID, TEXT) IS
'Check if user can use a specific feature. Premium users have unlimited usage.
For OCR: checks saved_credits_count (1 save for free users).
Fixed to check for plan_type = ''premium'' instead of specific plan IDs.';