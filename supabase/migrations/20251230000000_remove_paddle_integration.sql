-- Remove Paddle Integration
-- Date: 2025-12-30
-- Description: Complete removal of Paddle payment gateway integration
--              Keeping PayTR as the sole payment provider

-- ============================================
-- STEP 1: Drop Foreign Key Constraints
-- ============================================

-- Drop FK constraint from subscriptions to paddle_customers
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_paddle_customer_id_fkey;

-- ============================================
-- STEP 2: Drop Views that reference Paddle columns
-- ============================================

DROP VIEW IF EXISTS subscription_status_view;

-- ============================================
-- STEP 3: Drop Paddle columns from existing tables
-- ============================================

-- Drop Paddle columns from subscriptions table
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS paddle_subscription_id,
DROP COLUMN IF EXISTS paddle_plan_id,
DROP COLUMN IF EXISTS paddle_customer_id,
DROP COLUMN IF EXISTS paddle_checkout_id,
DROP COLUMN IF EXISTS paddle_subscription_data;

-- Drop Paddle columns from subscription_plans table
ALTER TABLE subscription_plans
DROP COLUMN IF EXISTS paddle_product_id,
DROP COLUMN IF EXISTS paddle_price_id;

-- Drop Paddle columns from invoices table
ALTER TABLE invoices
DROP COLUMN IF EXISTS paddle_transaction_id,
DROP COLUMN IF EXISTS paddle_invoice_id;

-- Drop Paddle columns from payment_transactions table
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS paddle_transaction_id,
DROP COLUMN IF EXISTS paddle_order_id;

-- ============================================
-- STEP 4: Update payment_provider defaults to PayTR
-- ============================================

-- Update subscription_plans default payment provider
ALTER TABLE subscription_plans
ALTER COLUMN payment_provider SET DEFAULT 'paytr';

-- Update existing NULL or 'paddle' values to 'paytr'
UPDATE subscription_plans
SET payment_provider = 'paytr'
WHERE payment_provider IS NULL OR payment_provider = 'paddle';

-- Update invoices default payment provider
ALTER TABLE invoices
ALTER COLUMN payment_provider SET DEFAULT 'paytr';

-- Update existing NULL or 'paddle' values to 'paytr'
UPDATE invoices
SET payment_provider = 'paytr'
WHERE payment_provider IS NULL OR payment_provider = 'paddle';

-- Update payment_transactions default payment provider
ALTER TABLE payment_transactions
ALTER COLUMN payment_provider SET DEFAULT 'paytr';

-- Update existing NULL or 'paddle' values to 'paytr'
UPDATE payment_transactions
SET payment_provider = 'paytr'
WHERE payment_provider IS NULL OR payment_provider = 'paddle';

-- ============================================
-- STEP 5: Drop Paddle-specific tables
-- ============================================

-- Drop paddle_webhook_events table
DROP TABLE IF EXISTS paddle_webhook_events CASCADE;

-- Drop paddle_customers table
DROP TABLE IF EXISTS paddle_customers CASCADE;

-- ============================================
-- STEP 6: Recreate subscription_status_view (without Paddle columns)
-- ============================================

CREATE OR REPLACE VIEW subscription_status_view AS
SELECT
  s.id,
  s.user_id,
  s.plan_id,
  s.status,
  s.start_date,
  s.expires_at,
  s.end_date,
  s.canceled_at,
  s.created_at,
  s.updated_at,
  p.email,
  p.first_name,
  p.last_name,
  sp.name as plan_name,
  sp.price as plan_price,
  sp.currency as plan_currency,
  sp.billing_period,
  -- PayTR specific columns
  s.paytr_order_id,
  s.paytr_transaction_id,
  s.paytr_payment_date,
  s.last_renewal_date,
  -- Compute days until renewal
  CASE
    WHEN s.status = 'active' AND s.expires_at IS NOT NULL
    THEN EXTRACT(DAY FROM (s.expires_at - NOW()))::int
    ELSE NULL
  END as days_until_renewal,
  -- Check if subscription is expiring soon (< 7 days)
  CASE
    WHEN s.status = 'active' AND s.expires_at IS NOT NULL
    THEN (s.expires_at - NOW()) < INTERVAL '7 days'
    ELSE FALSE
  END as expiring_soon
FROM subscriptions s
JOIN profiles p ON s.user_id = p.id
JOIN subscription_plans sp ON s.plan_id = sp.id;

-- ============================================
-- STEP 7: Remove Paddle webhook cleanup function
-- ============================================

DROP FUNCTION IF EXISTS cleanup_old_paddle_webhooks();

-- ============================================
-- STEP 8: Add migration success log
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Paddle integration successfully removed';
  RAISE NOTICE 'All Paddle tables, columns, and constraints have been dropped';
  RAISE NOTICE 'PayTR is now the sole payment provider';
END $$;
