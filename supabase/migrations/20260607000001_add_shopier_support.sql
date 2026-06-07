-- Add Shopier payment provider support

-- Add shopier_order_id to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS shopier_order_id TEXT;

-- Add shopier_order_id to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS shopier_order_id TEXT;

-- Add shopier_order_id to payment_transactions
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS shopier_order_id TEXT;

-- Index for idempotency check
CREATE INDEX IF NOT EXISTS idx_subscriptions_shopier_order_id
  ON subscriptions(shopier_order_id)
  WHERE shopier_order_id IS NOT NULL;

-- Table for orders where buyer email doesn't match a registered user
-- Allows admin to manually match and activate
CREATE TABLE IF NOT EXISTS shopier_unmatched_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC(10, 2),
  raw_payload JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only admins can see unmatched orders
ALTER TABLE shopier_unmatched_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only: shopier_unmatched_orders"
  ON shopier_unmatched_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
