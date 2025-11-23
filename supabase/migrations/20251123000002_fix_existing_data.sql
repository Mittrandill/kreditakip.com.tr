-- =====================================================
-- FIX EXISTING DATA BEFORE CONSTRAINTS
-- Priority: P0 - Run BEFORE 20251123000003_data_integrity.sql
-- =====================================================

-- Migration: Fix existing data that violates new constraints
-- Created: 2025-11-23
-- Description: Repairs existing data to comply with upcoming constraints

BEGIN;

-- =====================================================
-- 1. IDENTIFY AND FIX PAYMENT_PLANS ISSUES
-- =====================================================

-- First, let's see what's wrong
DO $$
DECLARE
  v_invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO v_invalid_count
  FROM payment_plans
  WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01;

  RAISE NOTICE 'Found % payment plans with invalid totals', v_invalid_count;
END $$;

-- Fix Strategy 1: Recalculate total_payment from principal + interest
UPDATE payment_plans
SET total_payment = principal_amount + interest_amount
WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01
  AND principal_amount >= 0
  AND interest_amount >= 0;

-- Fix Strategy 2: If principal or interest is negative, try to fix
UPDATE payment_plans
SET
  principal_amount = CASE WHEN principal_amount < 0 THEN 0 ELSE principal_amount END,
  interest_amount = CASE WHEN interest_amount < 0 THEN 0 ELSE interest_amount END,
  total_payment = CASE
    WHEN total_payment < 0 THEN 0
    ELSE total_payment
  END
WHERE principal_amount < 0 OR interest_amount < 0 OR total_payment < 0;

-- After fixing negative values, recalculate total_payment again
UPDATE payment_plans
SET total_payment = principal_amount + interest_amount
WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01;

-- =====================================================
-- 2. FIX CREDITS TABLE ISSUES
-- =====================================================

-- Fix negative or invalid amounts
UPDATE credits
SET remaining_debt = 0
WHERE remaining_debt < 0;

UPDATE credits
SET monthly_payment = CASE
  WHEN monthly_payment <= 0 THEN initial_amount / NULLIF(total_installments, 0)
  ELSE monthly_payment
END
WHERE monthly_payment <= 0 AND total_installments > 0;

-- Fix invalid interest rates
UPDATE credits
SET interest_rate = 0
WHERE interest_rate < 0;

UPDATE credits
SET interest_rate = 100
WHERE interest_rate > 100;

-- Fix invalid installment numbers
UPDATE credits
SET remaining_installments = 0
WHERE remaining_installments < 0;

UPDATE credits
SET remaining_installments = total_installments
WHERE remaining_installments > total_installments;

-- Fix invalid payment progress
UPDATE credits
SET payment_progress = 0
WHERE payment_progress < 0;

UPDATE credits
SET payment_progress = 100
WHERE payment_progress > 100;

-- Fix invalid date ranges
UPDATE credits
SET end_date = start_date + INTERVAL '1 year'
WHERE end_date <= start_date;

-- Fix invalid overdue days
UPDATE credits
SET overdue_days = 0
WHERE overdue_days < 0;

-- =====================================================
-- 3. FIX PAYMENT_HISTORY ISSUES
-- =====================================================

UPDATE payment_history
SET amount = 0
WHERE amount < 0;

-- =====================================================
-- 4. VERIFICATION REPORT
-- =====================================================

DO $$
DECLARE
  v_invalid_credits INT;
  v_invalid_payments INT;
  v_invalid_history INT;
BEGIN
  -- Check credits
  SELECT COUNT(*) INTO v_invalid_credits
  FROM credits
  WHERE initial_amount <= 0
     OR remaining_debt < 0
     OR monthly_payment <= 0
     OR interest_rate < 0
     OR interest_rate > 100
     OR total_installments <= 0
     OR remaining_installments < 0
     OR remaining_installments > total_installments
     OR payment_progress < 0
     OR payment_progress > 100
     OR end_date <= start_date
     OR overdue_days < 0;

  -- Check payment plans
  SELECT COUNT(*) INTO v_invalid_payments
  FROM payment_plans
  WHERE principal_amount < 0
     OR interest_amount < 0
     OR total_payment <= 0
     OR remaining_debt < 0
     OR installment_number <= 0
     OR abs(total_payment - (principal_amount + interest_amount)) >= 0.01;

  -- Check payment history
  SELECT COUNT(*) INTO v_invalid_history
  FROM payment_history
  WHERE amount < 0;

  -- Report results
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DATA FIX VERIFICATION REPORT';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Invalid credits remaining: %', v_invalid_credits;
  RAISE NOTICE 'Invalid payment plans remaining: %', v_invalid_payments;
  RAISE NOTICE 'Invalid payment history remaining: %', v_invalid_history;
  RAISE NOTICE '==============================================';

  IF v_invalid_credits > 0 OR v_invalid_payments > 0 OR v_invalid_history > 0 THEN
    RAISE WARNING 'Still have invalid data! Manual intervention required.';
  ELSE
    RAISE NOTICE '✅ All data is now valid and ready for constraints!';
  END IF;
END $$;

-- =====================================================
-- 5. DETAILED ISSUE REPORT (if any remain)
-- =====================================================

-- Show remaining invalid payment plans
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT
      id,
      credit_id,
      installment_number,
      principal_amount,
      interest_amount,
      total_payment,
      (principal_amount + interest_amount) as calculated_total,
      abs(total_payment - (principal_amount + interest_amount)) as difference
    FROM payment_plans
    WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01
    LIMIT 10
  LOOP
    RAISE NOTICE 'Invalid Payment Plan: ID=%, Installment=%, Principal=%, Interest=%, Total=%, Calculated=%, Diff=%',
      v_rec.id, v_rec.installment_number, v_rec.principal_amount,
      v_rec.interest_amount, v_rec.total_payment, v_rec.calculated_total, v_rec.difference;
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- NOTES
-- =====================================================

-- After running this migration:
-- 1. Review the NOTICE messages
-- 2. If still have invalid data, check the detailed report
-- 3. Once all data is valid, run: 20251123000003_data_integrity.sql

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- This migration only fixes data, no schema changes
-- Rollback not needed - data is improved
