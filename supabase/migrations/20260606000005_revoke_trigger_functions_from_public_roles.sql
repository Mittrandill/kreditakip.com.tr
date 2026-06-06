-- ============================================================================
-- SECURITY HARDENING: revoke trigger functions from public roles
-- Date: 2026-06-06
--
-- Advisor lints 0028/0029 flag SECURITY DEFINER functions executable by
-- anon/authenticated. The ones below are TRIGGER functions (invoked via table
-- triggers, never via PostgREST RPC), so they do not need EXECUTE granted to
-- public roles. Revoking clears the warnings with no functional impact.
-- (is_admin, can_use_feature, increment_*, track_ocr_analysis are intentionally
--  retained for app/RLS use; track_ocr_analysis loses only anon.)
-- ============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_new_user',
        'handle_subscription_change',
        'initialize_free_tier',
        'initialize_new_user',
        'create_default_notification_preferences',
        'prevent_sensitive_profile_modifications',
        'prevent_subscription_self_upgrade',
        'update_user_devices_updated_at',
        'update_notifications_mobile_updated_at'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.track_ocr_analysis(uuid, text) FROM anon;
