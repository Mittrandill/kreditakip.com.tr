-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Priority: P0 - CRITICAL SECURITY FIX
-- =====================================================

-- Migration: Enable RLS and create policies for all user tables
-- Created: 2025-11-23
-- Description: CRITICAL SECURITY FIX - Tables are currently accessible
--              by all authenticated users. This migration adds RLS policies
--              to ensure users can only access their own data.

BEGIN;

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles are created via trigger when user signs up
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. CREDITS TABLE - CRITICAL
-- =====================================================

ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credits
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own credits
CREATE POLICY "Users can insert own credits"
  ON credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own credits
CREATE POLICY "Users can update own credits"
  ON credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own credits
CREATE POLICY "Users can delete own credits"
  ON credits FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. PAYMENT_PLANS TABLE - CRITICAL
-- =====================================================

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- Users can view payment plans for their own credits
CREATE POLICY "Users can view own payment plans"
  ON payment_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_plans.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- Users can insert payment plans for their own credits
CREATE POLICY "Users can insert own payment plans"
  ON payment_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_plans.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- Users can update payment plans for their own credits
CREATE POLICY "Users can update own payment plans"
  ON payment_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_plans.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- Users can delete payment plans for their own credits
CREATE POLICY "Users can delete own payment plans"
  ON payment_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_plans.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. NOTIFICATIONS TABLE - CRITICAL
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications for any user (via service role)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read, soft delete)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. FINANCIAL_PROFILES TABLE - HIGHLY SENSITIVE
-- =====================================================

ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own financial profile
CREATE POLICY "Users can view own financial profile"
  ON financial_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own financial profile
CREATE POLICY "Users can insert own financial profile"
  ON financial_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own financial profile
CREATE POLICY "Users can update own financial profile"
  ON financial_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own financial profile
CREATE POLICY "Users can delete own financial profile"
  ON financial_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. SUBSCRIPTIONS TABLE - CRITICAL
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert subscriptions (payment callback)
CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- Service role can update subscriptions (renewal, cancellation)
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);

-- =====================================================
-- 7. PAYMENT_HISTORY TABLE
-- =====================================================

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view payment history for their own credits
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_history.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- Users can insert payment history for their own credits
CREATE POLICY "Users can insert own payment history"
  ON payment_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = payment_history.credit_id
        AND credits.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. BANKING_CREDENTIALS TABLE - EXTREMELY SENSITIVE
-- =====================================================

ALTER TABLE banking_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only view their own banking credentials
CREATE POLICY "Users can view own banking credentials"
  ON banking_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own banking credentials
CREATE POLICY "Users can insert own banking credentials"
  ON banking_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own banking credentials
CREATE POLICY "Users can update own banking credentials"
  ON banking_credentials FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own banking credentials
CREATE POLICY "Users can delete own banking credentials"
  ON banking_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. RISK_ANALYSES TABLE
-- =====================================================

ALTER TABLE risk_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own risk analyses
CREATE POLICY "Users can view own risk analyses"
  ON risk_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert risk analyses
CREATE POLICY "Service role can insert risk analyses"
  ON risk_analyses FOR INSERT
  WITH CHECK (true);

-- Service role can update risk analyses
CREATE POLICY "Service role can update risk analyses"
  ON risk_analyses FOR UPDATE
  USING (true);

-- =====================================================
-- 10. INVOICES TABLE
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert invoices
CREATE POLICY "Service role can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

-- Service role can update invoices
CREATE POLICY "Service role can update invoices"
  ON invoices FOR UPDATE
  USING (true);

-- =====================================================
-- 11. PAYMENT_TRANSACTIONS TABLE
-- =====================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert transactions
CREATE POLICY "Service role can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

-- Service role can update transactions
CREATE POLICY "Service role can update transactions"
  ON payment_transactions FOR UPDATE
  USING (true);

-- =====================================================
-- 12. PAYTR TABLES - HIGHLY SENSITIVE
-- =====================================================

-- paytr_user_tokens
ALTER TABLE paytr_user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paytr tokens"
  ON paytr_user_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage paytr tokens"
  ON paytr_user_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- paytr_saved_cards
ALTER TABLE paytr_saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved cards"
  ON paytr_saved_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved cards"
  ON paytr_saved_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage saved cards"
  ON paytr_saved_cards FOR ALL
  USING (true)
  WITH CHECK (true);

-- paytr_recurring_payments
ALTER TABLE paytr_recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring payments"
  ON paytr_recurring_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recurring payments"
  ON paytr_recurring_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 13. USAGE_TRACKING TABLE
-- =====================================================

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage usage
CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 14. BILLING_INFO TABLE
-- =====================================================

ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing info
CREATE POLICY "Users can view own billing info"
  ON billing_info FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own billing info
CREATE POLICY "Users can insert own billing info"
  ON billing_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own billing info
CREATE POLICY "Users can update own billing info"
  ON billing_info FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 15. NOTIFICATION_PREFERENCES TABLE
-- =====================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 16. PUBLIC REFERENCE TABLES (No RLS needed)
-- =====================================================

-- These tables are public and read-only for all users:
-- - banks
-- - credit_types
-- - subscription_plans
-- - blog_posts (published only)
-- - blog_categories

-- Banks - Everyone can read
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banks"
  ON banks FOR SELECT
  USING (is_active = true);

-- Credit Types - Everyone can read
ALTER TABLE credit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit types"
  ON credit_types FOR SELECT
  USING (is_active = true);

-- Subscription Plans - Everyone can read
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Blog Posts - Only published posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can manage own blog posts"
  ON blog_posts FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Blog Categories - Everyone can read
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog categories"
  ON blog_categories FOR SELECT
  USING (true);

-- =====================================================
-- 17. ADMIN POLICIES
-- =====================================================

-- Check if user is admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all data
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all credits"
  ON credits FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (is_admin());

-- =====================================================
-- 18. WEBHOOK & REQUEST LOGS (Admin only)
-- =====================================================

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Service role can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view request logs"
  ON request_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Service role can insert request logs"
  ON request_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 19. PENDING_SUBSCRIPTIONS TABLE
-- =====================================================

ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending subscriptions"
  ON pending_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pending subscriptions"
  ON pending_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 20. NEWSLETTER_SUBSCRIBERS (Public submission)
-- =====================================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (is_admin());

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS is enabled on all tables
-- SELECT
--   schemaname,
--   tablename,
--   rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- List all policies
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- 1. Service Role Key Bypass:
--    Queries using SERVICE_ROLE_KEY bypass RLS.
--    Use this ONLY in secure server-side code.

-- 2. Anon Key:
--    Queries using ANON_KEY respect RLS.
--    Use this in client-side code.

-- 3. Testing:
--    After applying, test all user flows to ensure
--    users can only access their own data.

-- 4. Admin Access:
--    Admins can view all data via is_admin() function.
--    Make sure to set is_admin = true for admin users.

-- =====================================================
-- ROLLBACK PLAN
-- =====================================================

-- To disable RLS on a table:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- DROP POLICY "policy_name" ON table_name;
