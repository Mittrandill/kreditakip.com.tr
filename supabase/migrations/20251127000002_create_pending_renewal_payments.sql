-- Migration: Create Pending Renewal Payments Table
-- Created: 2025-11-27
-- Purpose: Track 3D Secure payment requests waiting for user approval

CREATE TABLE IF NOT EXISTS public.pending_renewal_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,

  -- PayTR 3D Secure details
  merchant_oid VARCHAR(64) NOT NULL UNIQUE,
  payment_url TEXT NOT NULL,
  utoken VARCHAR(255) NOT NULL,
  ctoken VARCHAR(255) NOT NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- +72 hours
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT,
  paytr_response JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_pending_renewal_user_id ON public.pending_renewal_payments(user_id);
CREATE INDEX idx_pending_renewal_subscription_id ON public.pending_renewal_payments(subscription_id);
CREATE INDEX idx_pending_renewal_merchant_oid ON public.pending_renewal_payments(merchant_oid);
CREATE INDEX idx_pending_renewal_status ON public.pending_renewal_payments(status);
CREATE INDEX idx_pending_renewal_expires_at ON public.pending_renewal_payments(expires_at)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.pending_renewal_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pending renewals"
  ON public.pending_renewal_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
  ON public.pending_renewal_payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Table comment
COMMENT ON TABLE public.pending_renewal_payments IS '3D Secure renewal payment isteklerinin takibi (72 saat expiry)';
