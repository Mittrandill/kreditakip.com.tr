-- Fix OCR Save Limits for Premium Users
-- Premium users should have unlimited saves, not just 1

-- Drop the existing can_use_feature function
DROP FUNCTION IF EXISTS public.can_use_feature(UUID, TEXT);

-- Recreate can_use_feature function for SAVE operations only
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
    AND s.plan_type IN ('premium-monthly', 'premium-yearly')
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
COMMENT ON FUNCTION public.can_use_feature(UUID, TEXT) IS
'Check if user can use a specific feature. Premium users have unlimited usage.
For OCR: checks saved_credits_count (1 save for free users).
For other features: checks used_count against limit_count.';