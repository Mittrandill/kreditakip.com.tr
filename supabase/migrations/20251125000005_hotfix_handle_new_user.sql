-- =====================================================
-- HOTFIX: HANDLE NEW USER REGISTRATION ERROR
-- =====================================================
-- Add better error handling to prevent user registration failures
-- Created: 2025-11-25

BEGIN;

-- =====================================================
-- FIX HANDLE_NEW_USER WITH BETTER ERROR HANDLING
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  -- Create profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;

  -- Create notification preferences
  BEGIN
    INSERT INTO public.notification_preferences (
      user_id,
      email_enabled,
      push_enabled,
      payment_reminders,
      overdue_alerts,
      marketing_emails,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      true,
      true,
      true,
      true,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create notification preferences for user %: %', NEW.id, SQLERRM;
  END;

  -- Initialize free tier (with error handling)
  BEGIN
    -- Try new version with saved_credits_count
    INSERT INTO public.usage_tracking (
      user_id,
      feature_type,
      used_count,
      saved_credits_count,
      limit_count,
      reset_at
    )
    VALUES
      (NEW.id, 'ocr_analysis', 0, 0, 1, NOW() + INTERVAL '30 days'),
      (NEW.id, 'risk_analysis', 0, 0, 0, NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id, feature_type) DO NOTHING;
  EXCEPTION WHEN undefined_column THEN
    -- Fallback: If saved_credits_count doesn't exist yet, use old structure
    BEGIN
      INSERT INTO public.usage_tracking (
        user_id,
        feature_type,
        used_count,
        limit_count,
        reset_at
      )
      VALUES
        (NEW.id, 'ocr_analysis', 0, 1, NOW() + INTERVAL '30 days'),
        (NEW.id, 'risk_analysis', 0, 0, NOW() + INTERVAL '30 days')
      ON CONFLICT (user_id, feature_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to initialize free tier for user % (fallback): %', NEW.id, SQLERRM;
    END;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to initialize free tier for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the function
-- SELECT public.handle_new_user();
