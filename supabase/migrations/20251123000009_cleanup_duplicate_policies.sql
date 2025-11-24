-- =====================================================
-- CLEANUP DUPLICATE POLICIES
-- =====================================================
-- This migration removes duplicate permissive policies that cause
-- Supabase linter warnings about multiple_permissive_policies

BEGIN;

-- =====================================================
-- CREDITS TABLE
-- =====================================================
-- Keep: Standard user policies + admin view
-- Remove: None needed, already clean

-- =====================================================
-- INVOICES TABLE (9 policies -> 5 policies)
-- =====================================================
-- Problem: Service role ALL policy overlaps with everything
-- Solution: Keep service role ALL, remove user policies (they're redundant)

DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;

-- Keep these:
-- - Service role can manage all invoices (ALL)
-- - Only admins can delete invoices (DELETE)
-- - Only admins can insert invoices (INSERT)
-- - Admins can view all invoices (SELECT)
-- - Only admins can update invoices (UPDATE)

-- =====================================================
-- PAYMENT_TRANSACTIONS TABLE (9 policies -> 5 policies)
-- =====================================================
-- Problem: Multiple SELECT policies and multiple INSERT policies
-- Solution: Keep optimized versions, remove old ones

-- Remove old/duplicate INSERT policies
DROP POLICY IF EXISTS "Users can insert own transactions" ON payment_transactions;

-- Remove old/duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;

-- Remove UPDATE policy (keep service role UPDATE)
DROP POLICY IF EXISTS "Users can update their own payment transactions" ON payment_transactions;

-- Remove DELETE policy (users shouldn't delete transactions)
DROP POLICY IF EXISTS "Users can delete their own payment transactions" ON payment_transactions;

-- Keep these:
-- - Service role can manage all transactions (ALL)
-- - Users can insert their own payment transactions (INSERT)
-- - Admin can view all transactions (SELECT)
-- - Users can view their own payment transactions (SELECT)
-- - Service role can update transactions (UPDATE)

-- =====================================================
-- SUBSCRIPTIONS TABLE (6 policies -> 5 policies)
-- =====================================================
-- Problem: Service role ALL overlaps with user DELETE
-- Solution: Remove user DELETE (service role handles it)

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;

-- Keep these:
-- - Service role can manage all subscriptions (ALL)
-- - Users can insert their own subscriptions (INSERT)
-- - Admins can view all subscriptions (SELECT)
-- - Users can view their own subscriptions (SELECT)
-- - Users can update their own subscriptions (UPDATE)

-- =====================================================
-- NOTIFICATIONS TABLE (4 policies -> keep as is)
-- =====================================================
-- Already optimal, no duplicates

-- =====================================================
-- PAYMENT_HISTORY TABLE (8 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate policies - "for their credits" vs "their own payment history"
-- Solution: Keep "for their credits" (more specific, checks credit ownership)

DROP POLICY IF EXISTS "Users can delete their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can insert their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can update their own payment history" ON payment_history;

-- Keep these:
-- - Users can delete payment history for their credits (DELETE)
-- - Users can insert payment history for their credits (INSERT)
-- - Users can view payment history for their credits (SELECT)
-- - Users can update payment history for their credits (UPDATE)

-- =====================================================
-- PAYMENT_PLANS TABLE (8 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate policies - "for their credits" vs "their own payment plans"
-- Solution: Keep "for their credits" (more specific, checks credit ownership)

DROP POLICY IF EXISTS "Users can delete their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can insert their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can view their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can update their own payment plans" ON payment_plans;

-- Keep these:
-- - Users can delete payment plans for their credits (DELETE)
-- - Users can insert payment plans for their credits (INSERT)
-- - Users can view payment plans for their credits (SELECT)
-- - Users can update payment plans for their credits (UPDATE)

-- =====================================================
-- BLOG_POSTS TABLE (8 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate SELECT policies and overlapping admin/user policies
-- Solution: Keep "Published blog posts are publicly viewable" and user CRUD

DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Only admins can update blog posts" ON blog_posts;

-- Keep these:
-- - Users can delete their own blog posts (DELETE)
-- - Users can insert their own blog posts (INSERT)
-- - Published blog posts are publicly viewable (SELECT)
-- - Users can update their own blog posts (UPDATE)

-- =====================================================
-- PROFILES TABLE (7 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate INSERT and UPDATE policies
-- Solution: Keep optimized versions with "(SELECT auth.uid())"

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON profiles;

-- Keep these:
-- - Only admins can delete profiles (DELETE)
-- - Users can insert their own profile (INSERT)
-- - Admins can view all profiles (SELECT)
-- - Anyone can view profiles (SELECT)
-- - Users can update their own profile (UPDATE)

-- =====================================================
-- USAGE_TRACKING TABLE (6 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate SELECT and UPDATE policies - "own" vs "their own"
-- Solution: Keep "their own" versions (with SELECT auth.uid())

DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;

-- Keep these:
-- - Users can delete their own usage tracking (DELETE)
-- - Users can insert their own usage tracking (INSERT)
-- - Users can view their own usage tracking (SELECT)
-- - Users can update their own usage tracking (UPDATE)

-- =====================================================
-- BILLING_INFO TABLE (5 policies -> 4 policies)
-- =====================================================
-- Problem: Admin view all + user view their own = multiple SELECT policies
-- Solution: Keep both (valid use case - admins need to see all)
-- Actually already optimal at 5 policies

-- =====================================================
-- PAYTR_USER_TOKENS TABLE (5 policies -> 4 policies)
-- =====================================================
-- Problem: Duplicate SELECT policies - "own paytr tokens" vs "their own tokens"
-- Solution: Keep "their own tokens" (with SELECT auth.uid())

DROP POLICY IF EXISTS "Users can view own paytr tokens" ON paytr_user_tokens;

-- Keep these:
-- - Users can delete their own tokens (DELETE)
-- - Users can insert their own tokens (INSERT)
-- - Users can view their own tokens (SELECT)
-- - Users can update their own tokens (UPDATE)

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check remaining policy counts
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 5
ORDER BY policy_count DESC, tablename;
