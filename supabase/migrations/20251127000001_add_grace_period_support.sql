-- Migration: Add Grace Period Support to Subscriptions
-- Created: 2025-11-27
-- Purpose: Enable 7-day grace period for expired premium subscriptions

-- Add grace period tracking columns
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS grace_period_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_payment_action BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include 'suspended'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_status_check
CHECK (status IN ('active', 'cancelled', 'expired', 'suspended'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period
ON public.subscriptions(grace_period_ends_at)
WHERE grace_period_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_requires_payment
ON public.subscriptions(requires_payment_action)
WHERE requires_payment_action = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expires
ON public.subscriptions(status, expires_at);

-- Column comments
COMMENT ON COLUMN public.subscriptions.grace_period_started_at IS 'Abonelik bitiminde grace period başlangıç zamanı';
COMMENT ON COLUMN public.subscriptions.grace_period_ends_at IS 'Grace period bitiş zamanı (7 gün sonra)';
COMMENT ON COLUMN public.subscriptions.requires_payment_action IS 'Kullanıcıdan manuel ödeme gerekiyor mu?';
COMMENT ON COLUMN public.subscriptions.suspended_at IS 'Aboneliğin suspend edildiği zaman';
