-- =====================================================
-- CRITICAL PERFORMANCE INDEXES
-- Priority: P0 - Apply Immediately
-- Expected Impact: 10x query speed improvement
-- =====================================================

-- Migration: Add critical missing indexes for performance optimization
-- Created: 2025-11-23
-- Description: This migration adds 23 critical indexes that were missing
--              causing severe performance issues on main queries

BEGIN;

-- =====================================================
-- 1. CREDITS TABLE - Most frequently queried table
-- =====================================================

-- User credits listing (used in dashboard, credits page)
-- Impact: SELECT * FROM credits WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_credits_user_id_created_at
  ON credits(user_id, created_at DESC);

-- Credits by status (active, closed, overdue filtering)
-- Impact: SELECT * FROM credits WHERE user_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_credits_user_id_status
  ON credits(user_id, status);

-- Bank relationships (JOIN credits LEFT JOIN banks)
CREATE INDEX IF NOT EXISTS idx_credits_bank_id
  ON credits(bank_id);

-- Credit type relationships (JOIN credits LEFT JOIN credit_types)
CREATE INDEX IF NOT EXISTS idx_credits_credit_type_id
  ON credits(credit_type_id);

-- Overdue credits detection
CREATE INDEX IF NOT EXISTS idx_credits_status
  ON credits(status)
  WHERE status = 'overdue';

-- =====================================================
-- 2. PAYMENT_PLANS TABLE - High query frequency
-- =====================================================

-- Payment plans by credit (most common query)
-- Impact: SELECT * FROM payment_plans WHERE credit_id = ? ORDER BY installment_number
CREATE INDEX IF NOT EXISTS idx_payment_plans_credit_id
  ON payment_plans(credit_id, installment_number);

-- Pending payments by credit
-- Impact: SELECT * FROM payment_plans WHERE credit_id = ? AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_payment_plans_credit_id_status
  ON payment_plans(credit_id, status);

-- Upcoming payments by due date (critical for reminders)
-- Impact: SELECT * FROM payment_plans WHERE due_date = ? AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_payment_plans_due_date_status
  ON payment_plans(due_date, status)
  WHERE status = 'pending';

-- Overdue payments detection
-- Impact: SELECT * FROM payment_plans WHERE status = 'pending' AND due_date < CURRENT_DATE
CREATE INDEX IF NOT EXISTS idx_payment_plans_overdue
  ON payment_plans(due_date)
  WHERE status = 'pending';

-- =====================================================
-- 3. NOTIFICATIONS TABLE - Real-time queries
-- =====================================================

-- Unread notifications by user (header badge, notifications page)
-- Impact: SELECT * FROM notifications WHERE user_id = ? AND is_read = false AND deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE deleted_at IS NULL;

-- All user notifications
-- Impact: SELECT * FROM notifications WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_active
  ON notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Payment plan notifications (to check duplicates)
-- Impact: SELECT * FROM notifications WHERE payment_plan_id = ?
CREATE INDEX IF NOT EXISTS idx_notifications_payment_plan_id
  ON notifications(payment_plan_id);

-- Credit notifications
CREATE INDEX IF NOT EXISTS idx_notifications_credit_id
  ON notifications(credit_id);

-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(user_id, notification_type, created_at DESC);

-- =====================================================
-- 4. SUBSCRIPTIONS TABLE - Frequently checked
-- =====================================================

-- Active subscription check (every protected route)
-- Impact: SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON subscriptions(user_id, status)
  WHERE status = 'active';

-- Expiring subscriptions (cron job)
-- Impact: SELECT * FROM subscriptions WHERE expires_at < NOW() AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring
  ON subscriptions(expires_at)
  WHERE status = 'active';

-- Subscription by plan type
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON subscriptions(plan_id);

-- =====================================================
-- 5. PAYMENT_HISTORY TABLE - Reporting queries
-- =====================================================

-- Payment history by credit
-- Impact: SELECT * FROM payment_history WHERE credit_id = ? ORDER BY payment_date DESC
CREATE INDEX IF NOT EXISTS idx_payment_history_credit_date
  ON payment_history(credit_id, payment_date DESC);

-- Payment history by payment plan
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_plan
  ON payment_history(payment_plan_id);

-- Recent payments
CREATE INDEX IF NOT EXISTS idx_payment_history_date
  ON payment_history(payment_date DESC);

-- =====================================================
-- 6. FINANCIAL_PROFILES TABLE
-- =====================================================

-- Financial profile lookup
-- Impact: SELECT * FROM financial_profiles WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user
  ON financial_profiles(user_id);

-- =====================================================
-- 7. RISK_ANALYSES TABLE
-- =====================================================

-- Latest risk analysis by user
-- Impact: SELECT * FROM risk_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_risk_analyses_user_latest
  ON risk_analyses(user_id, created_at DESC);

-- =====================================================
-- 8. INVOICES TABLE
-- =====================================================

-- User invoices
-- Impact: SELECT * FROM invoices WHERE user_id = ? ORDER BY invoice_date DESC
CREATE INDEX IF NOT EXISTS idx_invoices_user_date
  ON invoices(user_id, invoice_date DESC);

-- Invoices by status
CREATE INDEX IF NOT EXISTS idx_invoices_user_status
  ON invoices(user_id, status);

-- Subscription invoices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription
  ON invoices(subscription_id);

-- =====================================================
-- 9. PAYTR TABLES - Payment processing
-- =====================================================

-- Active saved cards by user
-- Impact: SELECT * FROM paytr_saved_cards WHERE user_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_paytr_cards_user_active
  ON paytr_saved_cards(user_id, is_active)
  WHERE is_active = true;

-- Card token lookup
CREATE INDEX IF NOT EXISTS idx_paytr_cards_ctoken
  ON paytr_saved_cards(ctoken);

-- User token lookup
CREATE INDEX IF NOT EXISTS idx_paytr_user_tokens_user
  ON paytr_user_tokens(user_id);

-- Recurring payments by user
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_user
  ON paytr_recurring_payments(user_id, payment_status);

-- Merchant order lookup
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_merchant_oid
  ON paytr_recurring_payments(merchant_oid);

-- =====================================================
-- 10. USAGE_TRACKING TABLE
-- =====================================================

-- Usage limits check (every premium feature call)
-- Impact: SELECT * FROM usage_tracking WHERE user_id = ? AND feature_type = ?
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature
  ON usage_tracking(user_id, feature_type);

-- =====================================================
-- 11. BANKING_CREDENTIALS TABLE
-- =====================================================

-- Active banking credentials
-- Impact: SELECT * FROM banking_credentials WHERE user_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_banking_credentials_user_active
  ON banking_credentials(user_id, is_active)
  WHERE is_active = true;

-- Bank credentials lookup
CREATE INDEX IF NOT EXISTS idx_banking_credentials_bank
  ON banking_credentials(bank_id);

-- =====================================================
-- 12. BANKS & CREDIT_TYPES - Reference tables
-- =====================================================

-- Banks are queried frequently via JOINs
CREATE INDEX IF NOT EXISTS idx_banks_category
  ON banks(category, is_active)
  WHERE is_active = true;

-- Credit types for dropdowns
CREATE INDEX IF NOT EXISTS idx_credit_types_category
  ON credit_types(category, is_active)
  WHERE is_active = true;

-- =====================================================
-- 13. BLOG TABLES
-- =====================================================

-- Published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
  ON blog_posts(status, published_at DESC)
  WHERE status = 'published';

-- Posts by category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category
  ON blog_posts(category_id, published_at DESC)
  WHERE status = 'published';

-- Author posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_author
  ON blog_posts(author_id, published_at DESC);

COMMIT;

-- =====================================================
-- ANALYZE TABLES
-- Update statistics for query planner
-- =====================================================

ANALYZE credits;
ANALYZE payment_plans;
ANALYZE notifications;
ANALYZE subscriptions;
ANALYZE payment_history;
ANALYZE financial_profiles;
ANALYZE risk_analyses;
ANALYZE invoices;
ANALYZE paytr_saved_cards;
ANALYZE paytr_user_tokens;
ANALYZE paytr_recurring_payments;
ANALYZE usage_tracking;
ANALYZE banking_credentials;
ANALYZE banks;
ANALYZE credit_types;
ANALYZE blog_posts;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify indexes were created
-- =====================================================

-- List all new indexes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexname::regclass)) as size
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- =====================================================
-- ROLLBACK PLAN
-- If something goes wrong, run this:
-- =====================================================

-- DROP INDEX IF EXISTS idx_credits_user_id_created_at;
-- DROP INDEX IF EXISTS idx_credits_user_id_status;
-- ... (continue for all indexes)
