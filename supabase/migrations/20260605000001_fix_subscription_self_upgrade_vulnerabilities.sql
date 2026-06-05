-- ============================================================================
-- CRITICAL SECURITY FIX: Subscription self-upgrade vulnerabilities
-- Date: 2026-06-05
--
-- Fixes three actively exploitable vulnerabilities that let any authenticated
-- (or even anonymous) user grant themselves an unlimited paid subscription:
--
--   #1 subscriptions: RLS UPDATE policy let users change plan_type/expires_at
--      directly -> instant free permanent premium.
--   #2 subscription_usage: RLS let users INSERT/UPDATE/DELETE their own rows
--      -> reset usage counters / raise limits to 999999.
--   #3 admin_* RPCs: SECURITY DEFINER functions with EXECUTE granted to
--      anon/authenticated and NO internal admin check -> anyone could call
--      admin_create_subscription to grant any user premium.
--
-- All legitimate writes to these tables go through the service_role key
-- (PayTR callbacks, cron jobs, admin API, usage API) and are unaffected.
-- The only user-context write is change-plan (next_billing_plan_id), which
-- the FIX #1 trigger explicitly allows.
-- ============================================================================

-- ============================================================================
-- FIX #1: Block users from modifying sensitive subscription columns
-- Mirrors the existing prevent_sensitive_profile_modifications pattern.
-- service_role (PayTR, cron, admin API) bypasses the check.
-- Authenticated users may still update non-sensitive columns
-- (e.g. next_billing_plan_id used by /api/subscription/change-plan).
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_subscription_self_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role to modify anything
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to financially sensitive columns for everyone else
  IF OLD.plan_id          IS DISTINCT FROM NEW.plan_id
     OR OLD.plan_type     IS DISTINCT FROM NEW.plan_type
     OR OLD.status        IS DISTINCT FROM NEW.status
     OR OLD.expires_at    IS DISTINCT FROM NEW.expires_at
     OR OLD.start_date    IS DISTINCT FROM NEW.start_date
     OR OLD.user_id       IS DISTINCT FROM NEW.user_id
     OR OLD.payment_provider IS DISTINCT FROM NEW.payment_provider THEN
    RAISE EXCEPTION 'Modifying subscription plan/status fields is not allowed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS prevent_subscription_self_upgrade_trigger ON public.subscriptions;
CREATE TRIGGER prevent_subscription_self_upgrade_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_subscription_self_upgrade();

-- ============================================================================
-- FIX #2: Remove user write access to subscription_usage
-- Limits/counters must only be changed by service_role or the
-- SECURITY DEFINER tracking functions (track_ocr_analysis,
-- increment_saved_credits). Users keep SELECT (read) access only.
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.subscription_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.subscription_usage;
DROP POLICY IF EXISTS "Users can update own subscription usage" ON public.subscription_usage;
DROP POLICY IF EXISTS "Users can delete their own usage" ON public.subscription_usage;

-- Defense in depth: revoke table-level write grants from the authenticated role.
-- (RLS already denies once the policies are gone; this makes it explicit.)
REVOKE INSERT, UPDATE, DELETE ON public.subscription_usage FROM authenticated;

-- SELECT policies are intentionally kept:
--   "Users can view own subscription usage" / "Users can view their own usage"

-- ============================================================================
-- FIX #3: Revoke EXECUTE on admin subscription RPCs from anon/authenticated
-- These are SECURITY DEFINER and bypass RLS; only the admin API (service_role)
-- should ever call them. Covers all overloaded signatures.
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
        'admin_create_subscription',
        'admin_update_subscription',
        'admin_extend_subscription'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

COMMENT ON FUNCTION prevent_subscription_self_upgrade IS
  'Blocks authenticated users from changing plan/status/expiry on their own subscription row. service_role bypasses. Fixes self-upgrade vulnerability (2026-06-05).';
