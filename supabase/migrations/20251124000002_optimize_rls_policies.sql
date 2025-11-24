-- =====================================================
-- OPTIMIZE RLS POLICIES - FIX LINTER WARNINGS
-- =====================================================
-- This migration fixes 28 linter warnings:
-- - 2 auth_rls_initplan warnings (performance optimization)
-- - 26 multiple_permissive_policies warnings (duplicate policies)
--
-- Issue 1: auth.uid() should be wrapped in (SELECT auth.uid())
-- Issue 2: Multiple policies for same action should be consolidated

BEGIN;

-- =====================================================
-- PART 1: FIX AUTH_RLS_INITPLAN WARNINGS (2)
-- =====================================================

-- profiles: Optimize auth.uid() call
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- usage_tracking: Optimize auth.uid() call
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- PART 2: FIX MULTIPLE_PERMISSIVE_POLICIES (26)
-- =====================================================

-- ----------------------------------------------------
-- SUBSCRIPTIONS TABLE (6 warnings)
-- ----------------------------------------------------
-- Problem: "Service role can insert/update" + "Users can insert/update"
-- Solution: Remove user policies, keep only service role policies
-- Reasoning: Subscriptions should only be created/updated by service role (payment webhooks)

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

-- Keep these service role policies (already exist from previous migration)
-- CREATE POLICY "Service role can insert subscriptions"
-- CREATE POLICY "Service role can update subscriptions"

-- ----------------------------------------------------
-- USAGE_TRACKING TABLE (20 warnings)
-- ----------------------------------------------------
-- Problem: "Service role can manage" (ALL) overlaps with specific user policies
-- Solution: Keep service role ALL policy, remove duplicate user policies

DROP POLICY IF EXISTS "Users can view their own usage tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can delete their own usage tracking" ON usage_tracking;

-- Keep these two policies:
-- 1. "Users can view own usage" (SELECT) - for read access
-- 2. "Service role can manage usage" (ALL) - for all operations

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies are now optimized
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'usage_tracking', 'subscriptions')
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- After this migration:
-- - auth_rls_initplan warnings: 2 -> 0
-- - multiple_permissive_policies warnings: 26 -> 0
-- - Total linter warnings: 28 -> 0
--
-- Remaining policies:
--
-- profiles:
--   - Users can view own profile (SELECT)
--   - Users can update own profile (UPDATE)
--   - Users can insert own profile (INSERT)
--
-- subscriptions:
--   - Users can view subscriptions (admins see all) (SELECT)
--   - Service role can insert subscriptions (INSERT)
--   - Service role can update subscriptions (UPDATE)
--
-- usage_tracking:
--   - Users can view own usage (SELECT)
--   - Service role can manage usage (ALL)
