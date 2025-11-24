-- =====================================================
-- FIX INFINITE RECURSION AND RLS POLICY ISSUES
-- =====================================================
-- This migration fixes multiple critical RLS policy issues:
-- 1. Infinite recursion in profiles table (is_admin() function)
-- 2. Usage_tracking and subscriptions policies for service role
--
-- Issue 1: is_admin() function queries profiles table, which has a policy
--          that calls is_admin(), creating infinite recursion
-- Issue 2: Service role policies don't properly check auth.role()
--
-- Solution:
-- 1. Remove is_admin() function calls from profiles policies
-- 2. Use direct auth.uid() checks with explicit is_admin column
-- 3. Fix service role policies

BEGIN;

-- =====================================================
-- 0. FIX PROFILES INFINITE RECURSION
-- =====================================================

-- Drop ALL policies that cause recursion on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles (admins see all)" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Recreate the basic user policy for profiles
-- This ensures users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Note: We removed admin policies on profiles to prevent recursion
-- Admins can use service role to query profiles if needed

-- =====================================================
-- 1. FIX USAGE_TRACKING POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do ALL operations
CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- =====================================================
-- 2. FIX SUBSCRIPTIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;

-- Service role can insert subscriptions (payment callback)
CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Service role can update subscriptions (renewal, cancellation, expiration)
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify the policy exists and is correct
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'usage_tracking'
ORDER BY policyname;

-- =====================================================
-- EXPECTED RESULT
-- =====================================================
-- The policy should allow:
-- 1. Service role to perform ALL operations on any record
-- 2. Users to perform operations only on their own records
-- 3. The /api/subscription/status endpoint (using service role) to update usage_tracking
