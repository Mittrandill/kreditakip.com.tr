-- =====================================================
-- DATA INTEGRITY IMPROVEMENTS
-- Priority: P1 - High Priority
-- =====================================================

-- Migration: Add constraints, triggers, and data validation
-- Created: 2025-11-23
-- Description: Improves data integrity with check constraints,
--              CASCADE relationships, and automatic triggers

BEGIN;

-- =====================================================
-- 1. CASCADE DELETE RELATIONSHIPS
-- =====================================================

-- When a credit is deleted, also delete related payment plans
ALTER TABLE payment_plans
  DROP CONSTRAINT IF EXISTS payment_plans_credit_id_fkey,
  ADD CONSTRAINT payment_plans_credit_id_fkey
    FOREIGN KEY (credit_id)
    REFERENCES credits(id)
    ON DELETE CASCADE;

-- When a credit is deleted, set notifications to NULL (keep history)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_credit_id_fkey,
  ADD CONSTRAINT notifications_credit_id_fkey
    FOREIGN KEY (credit_id)
    REFERENCES credits(id)
    ON DELETE SET NULL;

-- When a payment plan is deleted, set notifications to NULL
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_payment_plan_id_fkey,
  ADD CONSTRAINT notifications_payment_plan_id_fkey
    FOREIGN KEY (payment_plan_id)
    REFERENCES payment_plans(id)
    ON DELETE SET NULL;

-- When a payment plan is deleted, keep payment history (audit trail)
ALTER TABLE payment_history
  DROP CONSTRAINT IF EXISTS payment_history_payment_plan_id_fkey,
  ADD CONSTRAINT payment_history_payment_plan_id_fkey
    FOREIGN KEY (payment_plan_id)
    REFERENCES payment_plans(id)
    ON DELETE SET NULL;

-- When a credit is deleted, CASCADE payment history
ALTER TABLE payment_history
  DROP CONSTRAINT IF EXISTS payment_history_credit_id_fkey,
  ADD CONSTRAINT payment_history_credit_id_fkey
    FOREIGN KEY (credit_id)
    REFERENCES credits(id)
    ON DELETE CASCADE;

-- When a user is deleted, CASCADE all user data
-- (This should be handled by a cleanup function, not CASCADE)
-- Keep foreign keys as RESTRICT to prevent accidental deletion

-- =====================================================
-- 2. CHECK CONSTRAINTS - Credits Table
-- =====================================================

-- Ensure positive amounts
ALTER TABLE credits
  DROP CONSTRAINT IF EXISTS credits_positive_amounts;

ALTER TABLE credits
  ADD CONSTRAINT credits_positive_amounts CHECK (
    initial_amount > 0 AND
    remaining_debt >= 0 AND
    monthly_payment > 0 AND
    interest_rate >= 0 AND
    interest_rate <= 100
  );

-- Ensure valid installment numbers
ALTER TABLE credits
  DROP CONSTRAINT IF EXISTS credits_valid_installments;

ALTER TABLE credits
  ADD CONSTRAINT credits_valid_installments CHECK (
    total_installments > 0 AND
    remaining_installments >= 0 AND
    remaining_installments <= total_installments
  );

-- Ensure valid payment progress (0-100%)
ALTER TABLE credits
  DROP CONSTRAINT IF EXISTS credits_valid_payment_progress;

ALTER TABLE credits
  ADD CONSTRAINT credits_valid_payment_progress CHECK (
    payment_progress >= 0 AND
    payment_progress <= 100
  );

-- Ensure valid date range
ALTER TABLE credits
  DROP CONSTRAINT IF EXISTS credits_valid_date_range;

ALTER TABLE credits
  ADD CONSTRAINT credits_valid_date_range CHECK (
    end_date > start_date
  );

-- Ensure valid overdue days
ALTER TABLE credits
  DROP CONSTRAINT IF EXISTS credits_valid_overdue_days;

ALTER TABLE credits
  ADD CONSTRAINT credits_valid_overdue_days CHECK (
    overdue_days >= 0
  );

-- =====================================================
-- 3. CHECK CONSTRAINTS - Payment Plans Table
-- =====================================================

-- Ensure positive amounts
ALTER TABLE payment_plans
  DROP CONSTRAINT IF EXISTS payment_plans_positive_amounts;

ALTER TABLE payment_plans
  ADD CONSTRAINT payment_plans_positive_amounts CHECK (
    principal_amount >= 0 AND
    interest_amount >= 0 AND
    total_payment > 0 AND
    remaining_debt >= 0
  );

-- Ensure valid installment number
ALTER TABLE payment_plans
  DROP CONSTRAINT IF EXISTS payment_plans_valid_installment;

ALTER TABLE payment_plans
  ADD CONSTRAINT payment_plans_valid_installment CHECK (
    installment_number > 0
  );

-- Ensure total_payment = principal_amount + interest_amount
ALTER TABLE payment_plans
  DROP CONSTRAINT IF EXISTS payment_plans_valid_total;

ALTER TABLE payment_plans
  ADD CONSTRAINT payment_plans_valid_total CHECK (
    abs(total_payment - (principal_amount + interest_amount)) < 0.01
  );

-- =====================================================
-- 4. CHECK CONSTRAINTS - Financial Profiles
-- =====================================================

-- All amounts must be non-negative
ALTER TABLE financial_profiles
  DROP CONSTRAINT IF EXISTS financial_profiles_non_negative;

-- Already has individual constraints, verify they exist

-- =====================================================
-- 5. CHECK CONSTRAINTS - Subscriptions
-- =====================================================

-- Ensure expires_at is in the future for active subscriptions
-- (This is enforced at application level, not database level)

-- =====================================================
-- 6. UNIQUE CONSTRAINTS
-- =====================================================

-- Only one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_subscription
  ON subscriptions(user_id)
  WHERE status = 'active';

-- Only one financial profile per user (already has UNIQUE on user_id)

-- Credit code should be unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_credit_code_per_user
  ON credits(user_id, credit_code);

-- =====================================================
-- 7. AUTOMATIC UPDATED_AT TRIGGERS
-- =====================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON banks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON credit_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON financial_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON banking_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON risk_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON paytr_saved_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON paytr_user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pending_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SOFT DELETE COLUMNS
-- =====================================================

-- Add deleted_at to important tables for soft delete
ALTER TABLE credits
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE payment_plans
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE banking_credentials
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 9. DEFAULT VALUES
-- =====================================================

-- Ensure proper defaults
ALTER TABLE credits
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN payment_progress SET DEFAULT 0,
  ALTER COLUMN remaining_installments SET DEFAULT 0,
  ALTER COLUMN total_installments SET DEFAULT 0,
  ALTER COLUMN overdue_days SET DEFAULT 0;

ALTER TABLE payment_plans
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE notifications
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN type SET DEFAULT 'info';

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate credit status
CREATE OR REPLACE FUNCTION calculate_credit_status(p_credit_id UUID)
RETURNS TABLE (
  remaining_debt NUMERIC,
  remaining_installments INT,
  payment_progress NUMERIC,
  status TEXT,
  overdue_days INT
) AS $$
DECLARE
  v_total_installments INT;
  v_paid_count INT;
  v_pending_debt NUMERIC;
  v_pending_count INT;
  v_latest_overdue_date DATE;
BEGIN
  -- Get payment plan statistics
  SELECT
    COUNT(*) FILTER (WHERE pp.status = 'pending'),
    COUNT(*) FILTER (WHERE pp.status = 'paid'),
    COUNT(*),
    SUM(pp.total_payment) FILTER (WHERE pp.status = 'pending'),
    MAX(pp.due_date) FILTER (WHERE pp.status = 'pending' AND pp.due_date < CURRENT_DATE)
  INTO
    v_pending_count,
    v_paid_count,
    v_total_installments,
    v_pending_debt,
    v_latest_overdue_date
  FROM payment_plans pp
  WHERE pp.credit_id = p_credit_id;

  -- Return calculated values
  RETURN QUERY SELECT
    COALESCE(v_pending_debt, 0)::NUMERIC as remaining_debt,
    COALESCE(v_pending_count, 0)::INT as remaining_installments,
    CASE
      WHEN v_total_installments > 0
      THEN ROUND((v_paid_count::NUMERIC / v_total_installments) * 100, 2)
      ELSE 0::NUMERIC
    END as payment_progress,
    CASE
      WHEN v_pending_count = 0 THEN 'closed'
      WHEN v_latest_overdue_date IS NOT NULL THEN 'overdue'
      ELSE 'active'
    END::TEXT as status,
    CASE
      WHEN v_latest_overdue_date IS NOT NULL
      THEN (CURRENT_DATE - v_latest_overdue_date)::INT
      ELSE 0
    END as overdue_days;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update credit status after payment plan changes
CREATE OR REPLACE FUNCTION update_credit_after_payment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_credit_stats RECORD;
BEGIN
  -- Calculate new credit status
  SELECT * INTO v_credit_stats
  FROM calculate_credit_status(COALESCE(NEW.credit_id, OLD.credit_id));

  -- Update credit
  UPDATE credits
  SET
    remaining_debt = v_credit_stats.remaining_debt,
    remaining_installments = v_credit_stats.remaining_installments,
    payment_progress = v_credit_stats.payment_progress,
    status = v_credit_stats.status,
    overdue_days = v_credit_stats.overdue_days,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.credit_id, OLD.credit_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update credit status when payment plan changes
CREATE TRIGGER update_credit_status_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_after_payment_change();

-- =====================================================
-- 11. VALIDATE EXISTING DATA
-- =====================================================

-- Check for data that violates new constraints
DO $$
DECLARE
  v_invalid_credits INT;
  v_invalid_payments INT;
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
     OR end_date <= start_date;

  IF v_invalid_credits > 0 THEN
    RAISE WARNING 'Found % credits with invalid data. Please fix before applying constraints.', v_invalid_credits;
  END IF;

  -- Check payment plans
  SELECT COUNT(*) INTO v_invalid_payments
  FROM payment_plans
  WHERE principal_amount < 0
     OR interest_amount < 0
     OR total_payment <= 0
     OR remaining_debt < 0
     OR installment_number <= 0
     OR abs(total_payment - (principal_amount + interest_amount)) >= 0.01;

  IF v_invalid_payments > 0 THEN
    RAISE WARNING 'Found % payment plans with invalid data. Please fix before applying constraints.', v_invalid_payments;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check constraints
-- SELECT
--   conrelid::regclass AS table_name,
--   conname AS constraint_name,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE contype = 'c'
--   AND connamespace = 'public'::regnamespace
-- ORDER BY table_name, constraint_name;

-- Check triggers
-- SELECT
--   trigger_schema,
--   trigger_name,
--   event_object_table,
--   action_timing,
--   event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;

-- =====================================================
-- NOTES
-- =====================================================

-- 1. The update_credit_status_on_payment_change trigger
--    automatically recalculates credit status when payment plans change.
--    This eliminates the need for manual updateCreditStatus() calls.

-- 2. Soft delete columns allow data recovery and audit trails.

-- 3. Check constraints prevent invalid data at the database level,
--    providing an additional layer of validation beyond application code.

-- 4. CASCADE deletes ensure referential integrity while SET NULL
--    preserves historical data for audit purposes.
