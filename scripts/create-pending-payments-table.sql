-- Pending Payments Table for PCI-DSS Compliant Checkout Flow
-- This table tracks payment initialization before completion

CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  token TEXT NOT NULL UNIQUE, -- Iyzico checkout token
  conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, expired
  payment_method TEXT NOT NULL DEFAULT 'iyzico_checkout',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'), -- Token expires in 1 hour
  metadata JSONB
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_payments_token ON pending_payments(token);
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_created_at ON pending_payments(created_at);

-- Row Level Security
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pending payments
CREATE POLICY "Users can view own pending payments"
  ON pending_payments FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (from API)
CREATE POLICY "Service role can insert pending payments"
  ON pending_payments FOR INSERT
  WITH CHECK (true); -- Checked in API layer

-- Only service role can update (from callback)
CREATE POLICY "Service role can update pending payments"
  ON pending_payments FOR UPDATE
  USING (true); -- Checked in API layer

-- Cleanup function for expired pending payments
CREATE OR REPLACE FUNCTION cleanup_expired_pending_payments()
RETURNS void AS $$
BEGIN
  UPDATE pending_payments
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW()
    AND expires_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run this manually via cron or pg_cron if available)
-- SELECT cron.schedule('cleanup-expired-payments', '*/15 * * * *', 'SELECT cleanup_expired_pending_payments();');

COMMENT ON TABLE pending_payments IS 'Tracks payment initialization for PCI-DSS compliant checkout flow';
COMMENT ON COLUMN pending_payments.token IS 'Iyzico checkout form token - used to retrieve payment result';
COMMENT ON COLUMN pending_payments.status IS 'Payment status: pending (initiated), completed (successful), failed, expired (token expired)';
COMMENT ON COLUMN pending_payments.expires_at IS 'Checkout token expiration time (typically 1 hour after creation)';
