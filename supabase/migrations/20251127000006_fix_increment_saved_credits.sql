-- Fix increment_saved_credits function for unlimited saves for premium users
-- Premium users should have unlimited credit saves

-- Drop existing function
DROP FUNCTION IF EXISTS public.increment_saved_credits(UUID);

-- Create improved function with limit checking
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
    AND s.plan_type IN ('premium-monthly', 'premium-yearly')
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

-- Add comment for documentation
COMMENT ON FUNCTION public.increment_saved_credits(UUID) IS
'Increment saved_credits_count for OCR credit saves.
Premium users: unlimited saves.
Free users: limited to 1 save.
Returns FALSE if limit reached, TRUE if successful.';