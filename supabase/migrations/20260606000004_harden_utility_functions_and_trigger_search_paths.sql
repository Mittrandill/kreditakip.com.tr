-- ============================================================================
-- SECURITY HARDENING: utility functions + trigger search paths
-- Date: 2026-06-06
--
-- #2  Revoke maintenance/utility SECURITY DEFINER functions from public roles.
--     They mutate data (mass-delete, invoice creation, reminder batches) and
--     must only be invoked by cron via service_role. Not used by client code.
--     (cleanup_old_paytr_webhooks is called by the webhook-cleanup cron with the
--      service_role key, which retains EXECUTE.)
-- #6  Pin the previously-mutable search_path on two updated_at trigger functions.
-- ============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'cleanup_old_notifications',
        'cleanup_old_webhook_logs',
        'cleanup_old_paytr_webhooks',
        'cleanup_expired_pending_subscriptions',
        'cleanup_old_pending_subscriptions',
        'create_invoice_for_payment',
        'create_payment_reminders_batch',
        'sync_usage_tracking_to_subscription_usage'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

ALTER FUNCTION public.update_user_devices_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_notifications_mobile_updated_at() SET search_path = 'public';
