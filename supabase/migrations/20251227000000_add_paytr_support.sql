-- =============================================
-- PayTR Payment Gateway Integration
-- Migration: Add PayTR support alongside Paddle
-- =============================================

-- Add PayTR-specific columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paytr_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paytr_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paytr_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_renewal_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_renewal_reminder_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for PayTR lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paytr_order_id
  ON subscriptions(paytr_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paytr_transaction_id
  ON subscriptions(paytr_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider
  ON subscriptions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal_reminder
  ON subscriptions(next_renewal_reminder_date)
  WHERE payment_provider = 'paytr' AND next_renewal_reminder_date IS NOT NULL;

-- Create PayTR webhook events table
CREATE TABLE IF NOT EXISTS paytr_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_paytr_order_id UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_paytr_webhooks_processed
  ON paytr_webhook_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_paytr_webhooks_order_id
  ON paytr_webhook_events(order_id);

-- Add PayTR columns to payment_transactions
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS paytr_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paytr_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paytr_payment_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_paytr_order_id
  ON payment_transactions(paytr_order_id);

-- Add PayTR columns to invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paytr_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paytr_transaction_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_invoices_paytr_order_id
  ON invoices(paytr_order_id);

-- Update existing subscriptions to have payment_provider set to 'paddle' if NULL
UPDATE subscriptions
SET payment_provider = 'paddle'
WHERE payment_provider IS NULL
  AND (paddle_subscription_id IS NOT NULL OR paddle_customer_id IS NOT NULL);

-- Ensure payment_provider constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payment_provider'
  ) THEN
    ALTER TABLE subscription_plans
    ADD CONSTRAINT check_payment_provider
      CHECK (payment_provider IN ('paddle', 'paytr'));
  END IF;
END $$;

-- Create view for expiring PayTR subscriptions (for reminder emails)
CREATE OR REPLACE VIEW paytr_subscriptions_expiring_soon AS
SELECT
  s.id,
  s.user_id,
  s.plan_id,
  s.expires_at,
  s.next_renewal_reminder_date,
  s.paytr_order_id,
  s.last_renewal_date,
  EXTRACT(DAY FROM (s.expires_at - NOW()))::INTEGER as days_until_expiry,
  p.email,
  p.first_name,
  p.last_name,
  sp.name as plan_name,
  sp.price as plan_price,
  sp.billing_period
FROM subscriptions s
INNER JOIN profiles p ON s.user_id = p.id
INNER JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE
  s.payment_provider = 'paytr'
  AND s.status = 'active'
  AND s.expires_at > NOW()
  AND s.expires_at < NOW() + INTERVAL '7 days'
  AND s.deleted_at IS NULL;

-- Add comment to table
COMMENT ON TABLE paytr_webhook_events IS 'Stores PayTR webhook callbacks for auditing and debugging';
COMMENT ON COLUMN subscriptions.paytr_order_id IS 'PayTR order ID (format: SUB-timestamp-userid or REN-timestamp-userid)';
COMMENT ON COLUMN subscriptions.next_renewal_reminder_date IS 'Next scheduled renewal reminder email date';

-- Grant permissions (if using RLS)
ALTER TABLE paytr_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access webhook events
CREATE POLICY "Admin only access to PayTR webhook events"
  ON paytr_webhook_events
  FOR ALL
  USING (false); -- No user access, only service role

-- Create function to cleanup old webhook events (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_paytr_webhooks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM paytr_webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND processed = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_paytr_webhooks IS 'Deletes processed PayTR webhook events older than 90 days';
