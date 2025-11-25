-- Simplified migration: Just update existing subscriptions based on payment amount
-- Run this if you already have the plan_id column

-- First, let's check what we have
SELECT
  s.id,
  s.user_id,
  s.plan_type,
  s.plan_id,
  pt.amount,
  pt.created_at as payment_date
FROM public.subscriptions s
LEFT JOIN public.payment_transactions pt
  ON pt.subscription_id = s.id
  AND pt.status = 'completed'
WHERE s.plan_type = 'premium'
ORDER BY pt.created_at DESC;

-- Update plan_id based on payment amount
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
WHERE s.plan_type = 'premium';

-- Verify the update
SELECT
  s.id,
  s.user_id,
  s.plan_type,
  s.plan_id,
  pt.amount,
  s.expires_at
FROM public.subscriptions s
LEFT JOIN public.payment_transactions pt
  ON pt.subscription_id = s.id
  AND pt.status = 'completed'
WHERE s.plan_type = 'premium'
ORDER BY s.created_at DESC;
