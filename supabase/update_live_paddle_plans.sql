-- ============================================================================
-- Paddle Live Environment Migration - Plan Updates
-- Target Table: public.subscription_plans
-- ============================================================================

BEGIN;

-- 1. Premium Plan - Monthly
UPDATE public.subscription_plans 
SET 
    paddle_product_id = 'pro_01kcrga40mwkf0t80drbe06rbd', 
    paddle_price_id = 'pri_01kcrgn0119qmdrgdy92phf840',
    updated_at = now()
WHERE id = 'premium-monthly';

-- 2. Premium Plan - Yearly
UPDATE public.subscription_plans 
SET 
    paddle_product_id = 'pro_01kcrga40mwkf0t80drbe06rbd', 
    paddle_price_id = 'pri_01kcrgdk1qex8pbyc2g47fv5dg',
    updated_at = now()
WHERE id = 'premium-yearly';

-- 3. Pro Plan - Monthly
UPDATE public.subscription_plans 
SET 
    paddle_product_id = 'pro_01kcrgadnmnknkz1c32yd50t5t', 
    paddle_price_id = 'pri_01kcrgqgnatmmafk81qb9skdv2',
    updated_at = now()
WHERE id = 'pro-monthly';

-- 4. Pro Plan - Yearly
UPDATE public.subscription_plans 
SET 
    paddle_product_id = 'pro_01kcrgadnmnknkz1c32yd50t5t', 
    paddle_price_id = 'pri_01kcrgrk0481d1wgrxw1gspqfq',
    updated_at = now()
WHERE id = 'pro-yearly';

COMMIT;

-- Verification query
SELECT id, name, paddle_product_id, paddle_price_id FROM public.subscription_plans;
