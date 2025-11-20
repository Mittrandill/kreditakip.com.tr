-- Migration: Update database schema from Iyzico to PayTR
-- This migration updates column names and removes Iyzico-specific references

-- 1. Update subscriptions table
-- Rename iyzico columns to be payment provider agnostic or PayTR specific
ALTER TABLE public.subscriptions
  RENAME COLUMN iyzico_subscription_id TO paytr_order_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN iyzico_subscription_reference TO payment_subscription_reference;

ALTER TABLE public.subscriptions
  RENAME COLUMN iyzico_payment_id TO payment_id;

-- Add comment to clarify the column usage
COMMENT ON COLUMN public.subscriptions.paytr_order_id IS 'PayTR order ID (merchant_oid) for tracking payments';
COMMENT ON COLUMN public.subscriptions.payment_subscription_reference IS 'Generic payment subscription reference (can be used by any provider)';
COMMENT ON COLUMN public.subscriptions.payment_id IS 'Generic payment transaction ID';

-- 2. Update payment_transactions table
-- Rename iyzico columns to PayTR
ALTER TABLE public.payment_transactions
  RENAME COLUMN iyzico_payment_id TO paytr_order_id;

ALTER TABLE public.payment_transactions
  RENAME COLUMN iyzico_conversation_id TO paytr_conversation_id;

-- Add comment
COMMENT ON COLUMN public.payment_transactions.paytr_order_id IS 'PayTR order ID (merchant_oid)';
COMMENT ON COLUMN public.payment_transactions.paytr_conversation_id IS 'PayTR conversation/transaction ID';

-- 3. Update pending_payments table - change default payment method
ALTER TABLE public.pending_payments
  ALTER COLUMN payment_method SET DEFAULT 'paytr_iframe';

-- Update existing records
UPDATE public.pending_payments
SET payment_method = 'paytr_iframe'
WHERE payment_method = 'iyzico_checkout';

-- 4. Update payment_method column constraint/check if exists
-- First, check if there are any constraints on payment_method columns

-- For payment_transactions table, update payment_method values
UPDATE public.payment_transactions
SET payment_method = 'paytr'
WHERE payment_method LIKE '%iyzico%' OR payment_method LIKE '%iyzi%';

-- For subscriptions table
UPDATE public.subscriptions
SET payment_method = 'paytr'
WHERE payment_method LIKE '%iyzico%' OR payment_method LIKE '%iyzi%';

-- 5. No need to change webhook_logs table structure as it's generic
-- But we can add a comment
COMMENT ON TABLE public.webhook_logs IS 'Generic webhook logs table - can store webhooks from any payment provider';

-- 6. Invoice table already uses generic payment_id, no changes needed

-- 7. Add indexes for better performance on new PayTR columns
CREATE INDEX IF NOT EXISTS idx_subscriptions_paytr_order_id
ON public.subscriptions(paytr_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_paytr_order_id
ON public.payment_transactions(paytr_order_id);

-- 8. Update any views or functions that reference the old column names
-- (Add specific view/function updates here if you have any)

-- Migration complete
-- To rollback, reverse the RENAME COLUMN operations and UPDATE statements
