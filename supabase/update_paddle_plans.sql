-- Update subscription plans with Paddle product IDs
-- Using actual Paddle product and price IDs from sandbox

-- Update Pro Monthly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01kb5xk5bb98dbye59qbrhpxzc',
  paddle_price_id = 'pri_01kb5xwj6fj97mzf9csj96k1z2',
  payment_provider = 'paddle'
WHERE id = 'pro-monthly';

-- Update Pro Yearly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01kb5xk5bb98dbye59qbrhpxzc',
  paddle_price_id = 'pri_01kb5y6e6mm2xad7s46pnhw191',
  payment_provider = 'paddle'
WHERE id = 'pro-yearly';

-- Update Premium Monthly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01kb5xvqecr4strv2w3kd6p7tf',
  paddle_price_id = 'pri_01kb5xwj6fj97mzf9csj96k1z2',
  payment_provider = 'paddle'
WHERE id = 'premium-monthly';

-- Update Premium Yearly Plan
UPDATE subscription_plans
SET
  paddle_product_id = 'pro_01kb5xvqecr4strv2w3kd6p7tf',
  paddle_price_id = 'pri_01kb5xzndnphf3gqqv0ay4ha1c',
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