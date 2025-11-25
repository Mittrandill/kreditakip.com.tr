-- Add plan_id column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Add check constraint for plan_id
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_id_check
CHECK (plan_id IN ('premium-monthly', 'premium-yearly') OR plan_id IS NULL);

-- Add iyzico_subscription_reference if not exists (for subscription reference code)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS iyzico_subscription_reference TEXT;

-- Create index for plan_id for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- Update existing premium subscriptions based on amount in payment_transactions
-- This is a one-time migration to set correct plan_id for existing users
UPDATE public.subscriptions s
SET plan_id = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.payment_transactions pt
    WHERE pt.subscription_id = s.id
    AND pt.amount >= 1900
    AND pt.status = 'completed'
  ) THEN 'premium-yearly'
  WHEN EXISTS (
    SELECT 1 FROM public.payment_transactions pt
    WHERE pt.subscription_id = s.id
    AND pt.amount < 1900
    AND pt.amount > 0
    AND pt.status = 'completed'
  ) THEN 'premium-monthly'
  ELSE NULL
END
WHERE s.plan_type = 'premium' AND s.plan_id IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.subscriptions.plan_id IS 'Specific plan identifier: premium-monthly or premium-yearly';
COMMENT ON COLUMN public.subscriptions.iyzico_subscription_reference IS 'iyzico subscription reference code for recurring payments';
