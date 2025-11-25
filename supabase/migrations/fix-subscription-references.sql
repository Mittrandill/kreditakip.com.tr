-- Fix NULL iyzico_subscription_reference by copying from iyzico_subscription_id
-- Bu script mevcut aboneliklerdeki NULL reference değerlerini düzeltir

UPDATE subscriptions
SET iyzico_subscription_reference = iyzico_subscription_id
WHERE iyzico_subscription_reference IS NULL
  AND iyzico_subscription_id IS NOT NULL;

-- Verify the update
SELECT
  id,
  user_id,
  plan_type,
  status,
  iyzico_subscription_id,
  iyzico_subscription_reference
FROM subscriptions
WHERE plan_type = 'premium';
