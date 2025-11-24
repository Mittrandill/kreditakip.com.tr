-- =====================================================
-- FIX REQUEST_LOGS DUPLICATE POLICY
-- =====================================================
-- Remove the old "Users can view their own request logs" policy
-- Keep only the consolidated "Users can view request logs (admins see all)"

BEGIN;

-- Drop the duplicate policy that wasn't removed in previous migration
DROP POLICY IF EXISTS "Users can view their own request logs" ON request_logs;

-- Verify: Should now have only these policies on request_logs:
-- 1. Users can view request logs (admins see all) (SELECT)
-- 2. Service role can insert request logs (INSERT)
-- Total: 2 policies

COMMIT;

-- Verification
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname || ' (' || cmd || ')', ', ' ORDER BY cmd) as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'request_logs'
GROUP BY schemaname, tablename;
