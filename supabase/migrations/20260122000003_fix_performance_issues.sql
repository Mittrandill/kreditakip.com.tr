-- ============================================================================
-- PERFORMANCE FIX: RLS and Index Optimizations
-- Date: 2026-01-22
--
-- Fixes:
-- 1. Duplicate index on subscription_usage
-- 2. Auth RLS initplan issues (auth.uid() -> (select auth.uid()))
-- 3. Remove duplicate/redundant policies
-- ============================================================================

-- ============================================================================
-- FIX 1: Remove duplicate constraint/index on subscription_usage
-- ============================================================================

ALTER TABLE subscription_usage DROP CONSTRAINT IF EXISTS subscription_usage_user_feature_unique;
-- Keep subscription_usage_user_id_feature_type_key (the primary constraint)

-- ============================================================================
-- FIX 2: Fix auth.uid() calls in RLS policies
-- Replace auth.uid() with (select auth.uid()) for better performance
-- ============================================================================

-- subscriptions table
DROP POLICY IF EXISTS "Users can update own subscription payment action" ON subscriptions;
CREATE POLICY "Users can update own subscription payment action" ON subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own subscription details" ON subscriptions;
CREATE POLICY "Users can view own subscription details" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- invoices table
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- billing_info table
DROP POLICY IF EXISTS "Users can insert own billing info" ON billing_info;
CREATE POLICY "Users can insert own billing info" ON billing_info
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own billing info" ON billing_info;
CREATE POLICY "Users can update own billing info" ON billing_info
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own billing info" ON billing_info;
CREATE POLICY "Users can view own billing info" ON billing_info
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- subscription_usage table
DROP POLICY IF EXISTS "Users can update own subscription usage" ON subscription_usage;
CREATE POLICY "Users can update own subscription usage" ON subscription_usage
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own subscription usage" ON subscription_usage;
CREATE POLICY "Users can view own subscription usage" ON subscription_usage
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- pending_subscriptions table
DROP POLICY IF EXISTS "Users can delete their own pending subscriptions" ON pending_subscriptions;
CREATE POLICY "Users can delete their own pending subscriptions" ON pending_subscriptions
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own pending subscriptions" ON pending_subscriptions;
CREATE POLICY "Users can insert their own pending subscriptions" ON pending_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own pending subscriptions" ON pending_subscriptions;
CREATE POLICY "Users can update their own pending subscriptions" ON pending_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own pending subscriptions" ON pending_subscriptions;
CREATE POLICY "Users can view their own pending subscriptions" ON pending_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- accounts table
DROP POLICY IF EXISTS "Adminler tüm hesapları görebilir" ON accounts;
DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını ekleyebilir" ON accounts;
DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını görüntüleyebilir" ON accounts;
DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını güncelleyebilir" ON accounts;
DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını silebilir" ON accounts;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own accounts or admins see all" ON accounts
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Users can insert own accounts" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own accounts" ON accounts
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own accounts" ON accounts
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- credit_cards table
DROP POLICY IF EXISTS "Adminler tüm kredi kartlarını görebilir" ON credit_cards;
DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını ekleyebilir" ON credit_cards;
DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını görüntüleyebilir" ON credit_cards;
DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını güncelleyebilir" ON credit_cards;
DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını silebilir" ON credit_cards;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own credit cards or admins see all" ON credit_cards
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Users can insert own credit cards" ON credit_cards
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own credit cards" ON credit_cards
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own credit cards" ON credit_cards
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- security_audit_logs table
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_logs;
CREATE POLICY "Admins can view audit logs" ON security_audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.is_admin = true
  ));

-- ============================================================================
-- FIX 3: Remove duplicate/redundant policies on billing_info
-- ============================================================================

-- Remove duplicate policies (keep the optimized ones we just created)
DROP POLICY IF EXISTS "Users can insert their own billing info" ON billing_info;
DROP POLICY IF EXISTS "Users can update their own billing info" ON billing_info;
DROP POLICY IF EXISTS "Users can view billing info (admins see all)" ON billing_info;
DROP POLICY IF EXISTS "Users can delete their own billing info" ON billing_info;

-- Add delete policy for billing_info
CREATE POLICY "Users can delete own billing info" ON billing_info
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- FIX 4: Remove duplicate policies on subscriptions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view subscriptions (admins see all)" ON subscriptions;
-- Keep "Users can view own subscription details" which we already optimized

-- ============================================================================
-- FIX 5: Remove duplicate policies on invoices
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
-- Keep "Users can view their own invoices" and add admin check to it

DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view own invoices or admins see all" ON invoices
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );
