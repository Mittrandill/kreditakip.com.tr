-- ============================================
-- PCI-DSS Database Verification Script
-- ============================================
-- Run this in Supabase SQL Editor to verify database is ready

-- 1. Check if pending_payments table exists
SELECT
  'pending_payments table' as check_name,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'pending_payments'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run scripts/create-pending-payments-table.sql'
  END as status;

-- 2. Check pending_payments columns
SELECT
  'pending_payments columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pending_payments';

-- 3. Check if subscription_plans exist
SELECT
  'subscription_plans' as check_name,
  COUNT(*) as plan_count,
  string_agg(id, ', ') as plan_ids
FROM subscription_plans;

-- 4. Verify required plans exist
SELECT
  id,
  name,
  price,
  billing_interval,
  CASE
    WHEN id IN ('premium-monthly', 'premium-yearly') THEN '✅ Valid'
    ELSE '⚠️ Check plan_id'
  END as validation
FROM subscription_plans
ORDER BY billing_interval, price;

-- 5. Check subscriptions table structure
SELECT
  'subscriptions required columns' as check_name,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      AND column_name = 'plan_id'
    ) THEN '✅ plan_id exists'
    ELSE '❌ plan_id missing'
  END as plan_id_check,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      AND column_name = 'iyzico_payment_id'
    ) THEN '✅ iyzico_payment_id exists'
    ELSE '⚠️ iyzico_payment_id missing (optional)'
  END as payment_id_check;

-- 6. Check RLS policies on pending_payments
SELECT
  'pending_payments RLS policies' as check_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pending_payments';

-- 7. Check if cleanup function exists
SELECT
  'cleanup_expired_pending_payments function' as check_name,
  CASE
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'cleanup_expired_pending_payments'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run scripts/create-pending-payments-table.sql'
  END as status;

-- 8. Check recent pending payments (test data)
SELECT
  'Recent pending_payments' as info,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count
FROM pending_payments
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. pending_payments table: ✅ EXISTS
-- 2. pending_payments columns: Should include id, user_id, plan_id, amount, token, status, etc.
-- 3. subscription_plans: Should have at least 2 plans
-- 4. Plan validation: premium-monthly and premium-yearly should be ✅ Valid
-- 5. subscriptions columns: plan_id should be ✅ exists
-- 6. RLS policies: Should have 3 policies (SELECT, INSERT, UPDATE)
-- 7. cleanup function: ✅ EXISTS
-- 8. Recent payments: Will be 0 if no payments yet (normal)

-- ============================================
-- IF ANY CHECKS FAIL:
-- ============================================
-- ❌ pending_payments missing → Run: scripts/create-pending-payments-table.sql
-- ❌ Plans missing → Check subscription_plans table, may need to add plans
-- ❌ plan_id column missing → May need migration (check existing subscriptions structure)
