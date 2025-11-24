-- =====================================================
-- FIX REMAINING LINTER WARNINGS
-- =====================================================
-- This migration fixes the last 41 linter warnings:
-- - 11 auth_rls_initplan warnings (admin policies)
-- - 30 multiple_permissive_policies warnings (admin + user SELECT overlap)

BEGIN;

-- =====================================================
-- PART 1: FIX AUTH_RLS_INITPLAN WARNINGS (11 warnings)
-- =====================================================
-- Optimize admin policies by wrapping auth.uid() with (SELECT auth.uid())

-- profiles: Only admins can delete profiles
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
CREATE POLICY "Only admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.is_admin = true
  )
);

-- payment_transactions: Admin can view all transactions
DROP POLICY IF EXISTS "Admin can view all transactions" ON payment_transactions;
CREATE POLICY "Admin can view all transactions"
ON payment_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- blog_categories: Admin policies (3 warnings)
DROP POLICY IF EXISTS "Only admins can delete blog categories" ON blog_categories;
DROP POLICY IF EXISTS "Only admins can insert blog categories" ON blog_categories;
DROP POLICY IF EXISTS "Only admins can update blog categories" ON blog_categories;

CREATE POLICY "Only admins can delete blog categories"
ON blog_categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Only admins can insert blog categories"
ON blog_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Only admins can update blog categories"
ON blog_categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- invoices: Admin policies (3 warnings)
DROP POLICY IF EXISTS "Only admins can delete invoices" ON invoices;
DROP POLICY IF EXISTS "Only admins can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Only admins can update invoices" ON invoices;

CREATE POLICY "Only admins can delete invoices"
ON invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Only admins can insert invoices"
ON invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Only admins can update invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- billing_info: Admin can view all billing info
DROP POLICY IF EXISTS "Admin can view all billing info" ON billing_info;
CREATE POLICY "Admin can view all billing info"
ON billing_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- request_logs: Service role and user policies
DROP POLICY IF EXISTS "Service role can insert request logs" ON request_logs;
DROP POLICY IF EXISTS "Users can view their own request logs" ON request_logs;

CREATE POLICY "Service role can insert request logs"
ON request_logs FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Users can view their own request logs"
ON request_logs FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- PART 2: FIX MULTIPLE_PERMISSIVE_POLICIES (30 warnings)
-- =====================================================
-- Consolidate admin + user SELECT policies into single policies

-- Strategy: Replace separate "Admin can view all" + "Users can view their own"
-- with a single policy that allows both conditions using OR

-- credits: Consolidate admin + user SELECT
DROP POLICY IF EXISTS "Admins can view all credits" ON credits;
DROP POLICY IF EXISTS "Users can view their own credits" ON credits;

CREATE POLICY "Users can view credits (admins see all)"
ON credits FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- profiles: Consolidate admin + public SELECT
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

CREATE POLICY "Public can view profiles (admins see all)"
ON profiles FOR SELECT
USING (
  true  -- Profiles are public
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.is_admin = true
  )
);

-- request_logs: Consolidate admin + user SELECT
DROP POLICY IF EXISTS "Admins can view request logs" ON request_logs;

CREATE POLICY "Users can view request logs (admins see all)"
ON request_logs FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- subscriptions: Consolidate admin + user SELECT
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;

CREATE POLICY "Users can view subscriptions (admins see all)"
ON subscriptions FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- billing_info: Consolidate admin + user SELECT
-- Note: We already recreated this policy in Part 1, but need to consolidate
DROP POLICY IF EXISTS "Admin can view all billing info" ON billing_info;
DROP POLICY IF EXISTS "Users can view their own billing info" ON billing_info;

CREATE POLICY "Users can view billing info (admins see all)"
ON billing_info FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- payment_transactions: Consolidate admin + user SELECT
DROP POLICY IF EXISTS "Admin can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON payment_transactions;

CREATE POLICY "Users can view transactions (admins see all)"
ON payment_transactions FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check final policy counts (should all be <= 4 now)
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY cmd, policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 4
ORDER BY policy_count DESC, tablename;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- After this migration:
-- - auth_rls_initplan warnings: 11 -> 0
-- - multiple_permissive_policies warnings: 30 -> 0
-- - Total linter warnings: 41 -> 0
--
-- All policies now:
-- 1. Use (SELECT auth.uid()) for optimal performance
-- 2. Have single policy per role/action combination
-- 3. Use OR conditions to handle admin + user access in one policy
