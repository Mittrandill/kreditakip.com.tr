-- ============================================================================
-- SETUP USER INITIALIZATION AND USAGE TRACKING
-- ============================================================================
-- This migration sets up automatic creation of required records for new users
-- and fixes existing users who are missing these records.
--
-- Changes:
-- 1. Creates trigger function to initialize user data on profile creation
-- 2. Fixes existing users missing notification_preferences
-- 3. Fixes existing users missing subscriptions
-- 4. Fixes existing users missing usage_tracking
-- 5. Sets up proper usage limits for free tier users
-- ============================================================================

-- ============================================================================
-- PART 1: Create trigger function for automatic user initialization
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_profile_created_initialize_user ON public.profiles;
DROP FUNCTION IF EXISTS public.initialize_new_user();

-- Create function to initialize new user data
CREATE OR REPLACE FUNCTION public.initialize_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification preferences with default values
  INSERT INTO public.notification_preferences (
    user_id,
    email_3_days_before,
    email_1_day_before,
    email_on_due_date,
    email_overdue,
    sms_1_day_before,
    sms_on_due_date,
    email_enabled,
    sms_enabled,
    notification_time
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    false,
    false,
    true,
    false,
    '09:00:00'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create free subscription
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    status,
    start_date,
    plan_id
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NULL
  )
  ON CONFLICT DO NOTHING;

  -- Create usage tracking for OCR analysis (unlimited for free users)
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    limit_count,
    saved_credits_count,
    reset_at
  ) VALUES (
    NEW.id,
    'ocr_analysis',
    0,
    999999, -- Unlimited OCR analysis for all users
    0,      -- 0 saved credits initially, max 1 for free users
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type) DO NOTHING;

  -- Create usage tracking for risk analysis (0 for free users, unlimited for premium)
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    limit_count,
    saved_credits_count,
    reset_at
  ) VALUES (
    NEW.id,
    'risk_analysis',
    0,
    0, -- Free users cannot use risk analysis (premium only)
    0,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created_initialize_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_new_user();

-- ============================================================================
-- PART 2: Fix existing users missing notification_preferences
-- ============================================================================

INSERT INTO public.notification_preferences (
  user_id,
  email_3_days_before,
  email_1_day_before,
  email_on_due_date,
  email_overdue,
  sms_1_day_before,
  sms_on_due_date,
  email_enabled,
  sms_enabled,
  notification_time
)
SELECT
  p.id,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  false,
  '09:00:00'
FROM public.profiles p
LEFT JOIN public.notification_preferences np ON p.id = np.user_id
WHERE np.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- PART 3: Fix existing users missing subscriptions
-- ============================================================================

INSERT INTO public.subscriptions (
  user_id,
  plan_type,
  status,
  start_date,
  plan_id
)
SELECT
  p.id,
  'free',
  'active',
  COALESCE(p.created_at, NOW()),
  NULL
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subscriptions s
  WHERE s.user_id = p.id
  AND s.status = 'active'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: Fix existing users missing usage_tracking
-- ============================================================================

-- Add OCR analysis tracking for users who don't have it
INSERT INTO public.usage_tracking (
  user_id,
  feature_type,
  used_count,
  limit_count,
  saved_credits_count,
  reset_at
)
SELECT
  p.id,
  'ocr_analysis',
  0,
  999999, -- Unlimited OCR analysis
  0,      -- Will be updated based on existing saved credits
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.usage_tracking ut
  WHERE ut.user_id = p.id
  AND ut.feature_type = 'ocr_analysis'
)
ON CONFLICT (user_id, feature_type) DO NOTHING;

-- Add risk analysis tracking for users who don't have it
INSERT INTO public.usage_tracking (
  user_id,
  feature_type,
  used_count,
  limit_count,
  saved_credits_count,
  reset_at
)
SELECT
  p.id,
  'risk_analysis',
  0,
  0, -- Free users cannot use risk analysis (premium only)
  0,
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.usage_tracking ut
  WHERE ut.user_id = p.id
  AND ut.feature_type = 'risk_analysis'
)
ON CONFLICT (user_id, feature_type) DO NOTHING;

-- ============================================================================
-- PART 5: Update existing usage_tracking to set unlimited OCR for all users
-- ============================================================================

-- Update all existing OCR tracking to have unlimited analysis
UPDATE public.usage_tracking
SET
  limit_count = 999999,
  updated_at = NOW()
WHERE feature_type = 'ocr_analysis';

-- Update all existing risk analysis tracking to 0 (free users cannot use)
UPDATE public.usage_tracking
SET
  limit_count = 0,
  updated_at = NOW()
WHERE feature_type = 'risk_analysis';

-- ============================================================================
-- PART 6: Update can_use_feature to handle saved credits logic
-- ============================================================================

-- Override the existing can_use_feature function to support saved credits
CREATE OR REPLACE FUNCTION public.can_use_feature(
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
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type = 'premium'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- Premium users have unlimited access to everything
  IF v_subscription.id IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- Risk analysis is premium-only feature
  IF p_feature_type = 'risk_analysis' THEN
    RETURN FALSE; -- Free users cannot use risk analysis
  END IF;

  -- Special handling for OCR analysis (checking saved credits, not analysis count)
  IF p_feature_type = 'ocr_analysis' THEN
    -- Free users: check saved_credits_count for OCR analysis
    SELECT * INTO v_usage
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND feature_type = 'ocr_analysis';

    -- No usage record = can save (first time)
    IF v_usage.id IS NULL THEN
      RETURN TRUE;
    END IF;

    -- Free users can save only 1 credit (saved_credits_count < 1)
    RETURN (COALESCE(v_usage.saved_credits_count, 0) < 1);
  END IF;

  -- For other features, use the normal usage limit check
  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND reset_at > NOW()
  LIMIT 1;

  -- No usage record = can use (will be created)
  IF v_usage.id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_usage.used_count < v_usage.limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user can save a credit (alternative name for clarity)
CREATE OR REPLACE FUNCTION public.can_user_save_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Just call can_use_feature with ocr_analysis
  RETURN public.can_use_feature(p_user_id, 'ocr_analysis');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Update usage limits when subscription changes
-- ============================================================================

-- Function to update usage limits based on subscription type
CREATE OR REPLACE FUNCTION public.update_usage_limits_for_subscription(p_user_id UUID, p_plan_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF p_plan_type = 'premium' THEN
    -- Premium kullanıcı: Risk analizi sınırsız yap
    UPDATE public.usage_tracking
    SET
      limit_count = 999999,
      updated_at = NOW()
    WHERE user_id = p_user_id
    AND feature_type = 'risk_analysis';

    -- OCR zaten sınırsız, değişiklik yok (sadece saved_credits_count farklı çalışıyor)

  ELSE
    -- Free kullanıcı: Risk analizi 0 yap
    UPDATE public.usage_tracking
    SET
      limit_count = 0,
      updated_at = NOW()
    WHERE user_id = p_user_id
    AND feature_type = 'risk_analysis';

    -- OCR için saved_credits_count sıfırla (ama mevcut kayıtları silme)
    -- Bu işlem kullanıcı free'ye düştüğünde tekrar kaydetmesini engeller
    -- Eğer zaten 1'den fazla kaydetmişse, yeni kayıt yapamaz
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Trigger: Subscription değiştiğinde usage limits'i güncelle
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni subscription insert edildiğinde
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_usage_limits_for_subscription(NEW.user_id, NEW.plan_type);
    RETURN NEW;
  END IF;

  -- Subscription update edildiğinde (plan_type değiştiyse)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.plan_type != NEW.plan_type OR OLD.status != NEW.status THEN
      -- Plan tipi değişti veya status değişti
      IF NEW.status = 'active' THEN
        PERFORM public.update_usage_limits_for_subscription(NEW.user_id, NEW.plan_type);
      ELSE
        -- Status active değilse, free gibi davran
        PERFORM public.update_usage_limits_for_subscription(NEW.user_id, 'free');
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı subscriptions tablosuna ekle
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_change();

-- ============================================================================
-- PART 8: Update existing premium users' limits
-- ============================================================================

-- Mevcut premium kullanıcıların risk analizi limitlerini güncelle
UPDATE public.usage_tracking ut
SET
  limit_count = 999999,
  updated_at = NOW()
FROM public.subscriptions s
WHERE ut.user_id = s.user_id
  AND s.status = 'active'
  AND s.plan_type = 'premium'
  AND ut.feature_type = 'risk_analysis';

-- ============================================================================
-- PART 9: Create/update functions for incrementing usage
-- ============================================================================

-- Update increment_usage to NOT increment used_count for OCR (unlimited analysis)
-- But keep the function for other features
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INT;
BEGIN
  -- OCR analysis is unlimited, so we don't increment used_count
  -- Only saved_credits_count is tracked (use increment_saved_credits instead)
  IF p_feature_type = 'ocr_analysis' THEN
    -- Just ensure the record exists, don't increment anything
    INSERT INTO public.usage_tracking (
      user_id,
      feature_type,
      used_count,
      limit_count,
      saved_credits_count,
      reset_at
    ) VALUES (
      p_user_id,
      p_feature_type,
      0,
      999999,
      0,
      NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id, feature_type) DO NOTHING;

    RETURN TRUE;
  END IF;

  -- Set limits based on feature type (for other features)
  v_limit := CASE p_feature_type
    WHEN 'risk_analysis' THEN 0 -- Free users cannot use risk analysis
    ELSE 5
  END;

  -- Insert or update usage for other features
  INSERT INTO public.usage_tracking (
    user_id,
    feature_type,
    used_count,
    limit_count,
    saved_credits_count,
    reset_at
  ) VALUES (
    p_user_id,
    p_feature_type,
    1,
    v_limit,
    0,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    used_count = usage_tracking.used_count + 1,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Function to increment saved credits count
CREATE OR REPLACE FUNCTION public.increment_saved_credits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Increment saved_credits_count for OCR analysis
  UPDATE public.usage_tracking
  SET
    saved_credits_count = saved_credits_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
  AND feature_type = 'ocr_analysis';

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.usage_tracking (
      user_id,
      feature_type,
      used_count,
      limit_count,
      saved_credits_count,
      reset_at
    ) VALUES (
      p_user_id,
      'ocr_analysis',
      0,
      999999,
      1,
      NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id, feature_type)
    DO UPDATE SET
      saved_credits_count = usage_tracking.saved_credits_count + 1,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ============================================================================
-- PART 10: Grant permissions to functions
-- ============================================================================

-- Grant execute permissions for authenticated users
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_save_credit(UUID) TO authenticated;

-- Grant execute permissions for service role (backend operations)
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_saved_credits(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_usage_limits_for_subscription(UUID, TEXT) TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - uncomment to verify)
-- ============================================================================

-- Check users without notification_preferences
-- SELECT p.id, p.email, p.full_name
-- FROM public.profiles p
-- LEFT JOIN public.notification_preferences np ON p.id = np.user_id
-- WHERE np.user_id IS NULL;

-- Check users without active subscriptions
-- SELECT p.id, p.email, p.full_name
-- FROM public.profiles p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.subscriptions s
--   WHERE s.user_id = p.id AND s.status = 'active'
-- );

-- Check users without usage_tracking
-- SELECT p.id, p.email, p.full_name
-- FROM public.profiles p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.usage_tracking ut
--   WHERE ut.user_id = p.id AND ut.feature_type = 'ocr_analysis'
-- );

-- Summary of all users and their setup status
-- SELECT
--   p.id,
--   p.email,
--   p.full_name,
--   CASE WHEN np.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_notification_prefs,
--   CASE WHEN s.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_subscription,
--   CASE WHEN ut.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_usage_tracking,
--   s.plan_type,
--   ut.saved_credits_count
-- FROM public.profiles p
-- LEFT JOIN public.notification_preferences np ON p.id = np.user_id
-- LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
-- LEFT JOIN public.usage_tracking ut ON p.id = ut.user_id AND ut.feature_type = 'ocr_analysis';

-- Test can_use_feature for a user
-- SELECT public.can_use_feature('user-id-here', 'ocr_analysis');

-- Test increment_saved_credits for a user
-- SELECT public.increment_saved_credits('user-id-here');

-- Check a user's usage tracking
-- SELECT * FROM public.usage_tracking WHERE user_id = 'user-id-here';
