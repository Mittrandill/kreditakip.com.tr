-- Migration: Update PayTR Recurring Payments for 3D Secure
-- Created: 2025-11-27
-- Purpose: Add columns to track 3D Secure payments and user approvals

ALTER TABLE public.paytr_recurring_payments
ADD COLUMN IF NOT EXISTS is_3d_secure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_approval_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- Index for filtering 3D Secure payments
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_is_3d
ON public.paytr_recurring_payments(is_3d_secure);

-- Column comments
COMMENT ON COLUMN public.paytr_recurring_payments.is_3d_secure IS 'Ödeme 3D Secure ile mi yapıldı?';
COMMENT ON COLUMN public.paytr_recurring_payments.user_approval_at IS 'Kullanıcının 3D Secure onay zamanı';
COMMENT ON COLUMN public.paytr_recurring_payments.payment_url IS '3D Secure payment URL (SMS approval için)';
