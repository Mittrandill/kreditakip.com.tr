-- ============================================================================
-- SECURITY FIX: Set search_path for all functions
-- Date: 2026-01-22
--
-- This prevents search_path injection attacks where an attacker could
-- manipulate the search_path to make functions execute different code.
--
-- Using DO blocks with EXCEPTION handling to skip non-existent functions
-- ============================================================================

DO $$ BEGIN
  ALTER FUNCTION public.prevent_sensitive_profile_modifications() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.cleanup_old_paytr_webhooks() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.set_updated_at() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.test_webhook_cleanup() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.track_ocr_analysis(uuid, text) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.handle_subscription_status_transition() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.reset_subscription_usage() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.get_effective_subscription_status(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.cleanup_expired_pending_subscriptions() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.sync_usage_tracking_to_subscription_usage() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.can_user_save_credit(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.create_default_notification_preferences() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.initialize_new_user() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.handle_subscription_change() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.increment_usage(uuid, text) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION public.increment_saved_credits(uuid, text) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ============================================================================
-- NOTE: RLS Policy warnings are intentional:
--
-- 1. "Service role full access to billing_info" - Service role needs full access
-- 2. "Anyone can subscribe to newsletter" - Public newsletter signup is intended
--
-- These are NOT security vulnerabilities when used correctly.
-- ============================================================================

-- ============================================================================
-- NOTE: Leaked Password Protection
--
-- Enable this in Supabase Dashboard:
-- Authentication > Settings > Password Security > Enable "Prevent use of leaked passwords"
--
-- This cannot be enabled via SQL migration.
-- ============================================================================
