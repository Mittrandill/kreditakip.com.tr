-- Allow 'shopier' as a payment_provider on subscriptions.
-- The original check_payment_provider constraint only permitted paddle/paytr,
-- which silently rejected every Shopier OSB subscription insert (the handler
-- caught the error and returned success, so paid orders vanished).

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS check_payment_provider;
ALTER TABLE subscriptions ADD CONSTRAINT check_payment_provider
  CHECK (payment_provider::text = ANY (ARRAY['paddle','paytr','shopier']::text[]));

-- Diagnostic columns for shopier_unmatched_orders
ALTER TABLE shopier_unmatched_orders ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE shopier_unmatched_orders ADD COLUMN IF NOT EXISTS raw_body TEXT;
ALTER TABLE shopier_unmatched_orders ALTER COLUMN plan_id DROP NOT NULL;
