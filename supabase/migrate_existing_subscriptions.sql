-- Migration: Update Existing Subscriptions to New Premium Plans
-- This script upgrades all existing subscribers to unlimited Premium plans
-- for customer satisfaction and smooth transition

-- ==============================================================================
-- PART 1: Update all existing premium subscriptions to keep premium status
-- ==============================================================================

-- All existing premium-monthly subscribers remain premium-monthly (399 TL - unlimited)
-- All existing premium-yearly subscribers remain premium-yearly (3830 TL - unlimited)
-- No plan_id changes needed, but we ensure they have unlimited limits

-- Update usage_tracking to unlimited for all existing premium users
UPDATE public.usage_tracking
SET
  limit_count = -1,  -- -1 means unlimited
  updated_at = now()
WHERE
  feature_type = 'ocr_analysis'
  AND user_id IN (
    SELECT user_id
    FROM public.subscriptions
    WHERE plan_type = 'premium'
      AND status = 'active'
      AND plan_id IN ('premium-monthly', 'premium-yearly')
  );

UPDATE public.usage_tracking
SET
  limit_count = -1,  -- -1 means unlimited
  updated_at = now()
WHERE
  feature_type = 'risk_analysis'
  AND user_id IN (
    SELECT user_id
    FROM public.subscriptions
    WHERE plan_type = 'premium'
      AND status = 'active'
      AND plan_id IN ('premium-monthly', 'premium-yearly')
  );

-- ==============================================================================
-- PART 2: Update subscription plans pricing (if needed)
-- ==============================================================================

-- Ensure premium-monthly plan has correct pricing (399 TL)
UPDATE public.subscription_plans
SET
  price = 399,
  description = 'Aylık 399 TL ile sınırsız özelliklere erişin',
  features = '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge"]'::jsonb,
  metadata = '{"ocr_limit": -1, "risk_analysis_limit": -1}'::jsonb,
  updated_at = now()
WHERE id = 'premium-monthly';

-- Ensure premium-yearly plan has correct pricing (3830 TL with 20% discount)
UPDATE public.subscription_plans
SET
  price = 3830,
  original_price = 4788,
  description = 'Yıllık öde, %20 tasarruf et',
  features = '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge", "Yıllık fatura kolaylığı"]'::jsonb,
  metadata = '{"ocr_limit": -1, "risk_analysis_limit": -1}'::jsonb,
  updated_at = now()
WHERE id = 'premium-yearly';

-- ==============================================================================
-- PART 3: Verification queries (run these to check the results)
-- ==============================================================================

-- Check all active premium subscriptions
-- SELECT
--   s.user_id,
--   s.plan_id,
--   s.status,
--   s.expires_at,
--   ut_ocr.limit_count as ocr_limit,
--   ut_risk.limit_count as risk_limit
-- FROM public.subscriptions s
-- LEFT JOIN public.usage_tracking ut_ocr ON s.user_id = ut_ocr.user_id AND ut_ocr.feature_type = 'ocr_analysis'
-- LEFT JOIN public.usage_tracking ut_risk ON s.user_id = ut_risk.user_id AND ut_risk.feature_type = 'risk_analysis'
-- WHERE s.plan_type = 'premium' AND s.status = 'active'
-- ORDER BY s.created_at DESC;

-- Check subscription plans
-- SELECT id, name, price, original_price, billing_period, metadata
-- FROM public.subscription_plans
-- WHERE id IN ('premium-monthly', 'premium-yearly')
-- ORDER BY sort_order;

-- ==============================================================================
-- Summary
-- ==============================================================================
-- This migration ensures:
-- 1. All existing premium subscribers keep their premium status
-- 2. All limits are set to unlimited (-1)
-- 3. Plan metadata and pricing are correct
-- 4. No customer is downgraded - everyone stays at premium level
-- ==============================================================================
