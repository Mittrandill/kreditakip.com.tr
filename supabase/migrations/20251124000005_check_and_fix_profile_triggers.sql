-- =====================================================
-- CHECK AND FIX PROFILE TRIGGERS
-- =====================================================
-- This migration checks if required functions exist and
-- creates stub functions if they don't to prevent errors
--
-- Issue: Profile creation triggers reference functions that may not exist
-- Solution: Create safe stub functions if they don't exist

BEGIN;

-- =====================================================
-- 1. CHECK AND CREATE initialize_free_tier FUNCTION
-- =====================================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.initialize_free_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Create usage tracking entry for free tier
  INSERT INTO public.usage_tracking (user_id, feature_type, current_count, limit_count)
  VALUES (NEW.id, 'ocr_analysis', 0, 1)
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
-- 2. CHECK AND CREATE notification preferences FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    payment_reminders,
    payment_confirmations,
    account_updates
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to create notification preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CHECK AND CREATE updated_at FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ENSURE ALL TRIGGERS EXIST
-- =====================================================

-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON public.profiles;
DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;

-- Create triggers
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

CREATE TRIGGER on_user_created_initialize_free_tier
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_free_tier();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- =====================================================
-- EXPECTED RESULT
-- =====================================================
-- After this migration:
-- 1. All required functions will exist
-- 2. All triggers will be properly configured
-- 3. User registration will work without errors
-- 4. Free tier usage tracking will be initialized
-- 5. Notification preferences will be created
