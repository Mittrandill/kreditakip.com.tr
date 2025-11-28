-- Update subscription plans with Paddle product IDs
-- NOTE: You need to replace these with your actual Paddle product and price IDs

-- Update Pro Monthly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01HSFNYK5K8WQMN5QZ8A9Y6M2R',
  paddle_price_id = 'pri_01HSFNZ5X3G4V6B2Z5Y6W8Q3K',
  payment_provider = 'paddle'
WHERE id = 'pro-monthly';

-- Update Pro Yearly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01HSFNYK5K8WQMN5QZ8A9Y6M2R',
  paddle_price_id = 'pri_01HSFNZ8Y4V7B2Z5X9W8Q3K',
  payment_provider = 'paddle'
WHERE id = 'pro-yearly';

-- Update Premium Monthly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pre_01HSFNZ0W2X1Y4K6M8N9Q7P5R',
  paddle_price_id = 'pri_01HSFNZ3Z5Y6X9W8Q2K3V7B4',
  payment_provider = 'paddle'
WHERE id = 'premium-monthly';

-- Update Premium Yearly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pre_01HSFNZ0W2X1Y4K6M8N9Q7P5R',
  paddle_price_id = 'pri_01HSFNZ6X8Y9W2K3V5B7Q9Z4',
  payment_provider = 'paddle'
WHERE id = 'premium-yearly';

-- Verify updates
SELECT
  id,
  name,
  price,
  period,
  paddle_product_id,
  paddle_price_id,
  payment_provider,
  is_active
FROM subscription_plans
WHERE id IN ('pro-monthly', 'pro-yearly', 'premium-monthly', 'premium-yearly')
ORDER BY price;