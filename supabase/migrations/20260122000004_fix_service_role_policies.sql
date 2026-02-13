-- ============================================================================
-- PERFORMANCE FIX: Restrict service_role policies to service_role only
-- Date: 2026-01-22
-- ============================================================================

-- Fix billing_info: Service role policy should only apply to service_role
DROP POLICY IF EXISTS "Service role full access to billing info" ON billing_info;
CREATE POLICY "Service role full access to billing info" ON billing_info
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix subscriptions: Service role policy should only apply to service_role
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
CREATE POLICY "Service role can update subscriptions" ON subscriptions
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);
