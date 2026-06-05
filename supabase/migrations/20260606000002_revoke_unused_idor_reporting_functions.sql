-- ============================================================================
-- SECURITY FIX: revoke IDOR-prone reporting RPCs from public roles
-- Date: 2026-06-06
--
-- These SECURITY DEFINER functions accept a p_user_id parameter and bypass RLS,
-- but do NOT verify p_user_id against auth.uid(). Any authenticated user could
-- read another user's financial data by supplying their UUID (IDOR). None of
-- them are referenced by the application code, so EXECUTE is revoked from
-- PUBLIC/anon/authenticated. service_role and the owner retain access.
-- (get_credit_details DOES check ownership, but only against the passed
--  p_user_id, so it is included for consistency since it is also unused.)
-- ============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_user_dashboard_summary',
        'get_credit_details',
        'get_bank_debt_breakdown',
        'get_upcoming_payments',
        'check_subscription_status',
        'calculate_financial_health_metrics',
        'can_user_save_credit',
        'get_ocr_save_count'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;
