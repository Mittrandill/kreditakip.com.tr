-- Update Subscription Plans
-- Changes:
-- 1. Keep Free plan as is
-- 2. Pro Plan - 199 TL (monthly/yearly): 10 OCR limit, 5 AI Finansal Sağlık Analizi
-- 3. Premium Plan - 399 TL (monthly/yearly): unlimited OCR and AI Finansal Sağlık Analizi
-- 4. Yearly plans have 20% discount
-- 5. Remove 3D Secure and card storage (handled in application code)

-- First, update existing plans or insert new ones
INSERT INTO public.subscription_plans (id, name, description, price, original_price, currency, billing_period, billing_interval, features, is_active, is_popular, sort_order, metadata)
VALUES
  -- Free Plan (unchanged)
  ('free', 'Free', 'Ücretsiz kullan, basit özelliklere eriş', 0, NULL, 'TRY', 'lifetime', 0,
   '["Temel OCR özellikleri", "Manuel kredi takibi", "Basit raporlar"]'::jsonb,
   true, false, 0,
   '{"ocr_limit": null, "risk_analysis_limit": null}'::jsonb
  ),

  -- Pro Monthly - 199 TL (10 OCR, 5 AI Finansal Sağlık Analizi)
  ('pro-monthly', 'Pro', 'Aylık 199 TL ile profesyonel özelliklere erişin', 199, NULL, 'TRY', 'monthly', 1,
   '["10 adet OCR kredi döküm analizi", "5 adet AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek"]'::jsonb,
   true, false, 1,
   '{"ocr_limit": 10, "risk_analysis_limit": 5}'::jsonb
  ),

  -- Pro Yearly - 1910 TL (20% discount, 10 OCR/month, 5 AI Finansal Sağlık Analizi/month)
  ('pro-yearly', 'Pro', 'Yıllık öde, %20 tasarruf et', 1910, 2388, 'TRY', 'yearly', 1,
   '["10 adet OCR kredi döküm analizi (aylık)", "5 adet AI Finansal Sağlık Analizi (aylık)", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Yıllık fatura kolaylığı"]'::jsonb,
   true, false, 2,
   '{"ocr_limit": 10, "risk_analysis_limit": 5}'::jsonb
  ),

  -- Premium Monthly - 399 TL (unlimited)
  ('premium-monthly', 'Premium', 'Aylık 399 TL ile sınırsız özelliklere erişin', 399, NULL, 'TRY', 'monthly', 1,
   '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge"]'::jsonb,
   true, true, 3,
   '{"ocr_limit": -1, "risk_analysis_limit": -1}'::jsonb
  ),

  -- Premium Yearly - 3830 TL (20% discount, unlimited)
  ('premium-yearly', 'Premium', 'Yıllık öde, %20 tasarruf et', 3830, 4788, 'TRY', 'yearly', 1,
   '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge", "Yıllık fatura kolaylığı"]'::jsonb,
   true, true, 4,
   '{"ocr_limit": -1, "risk_analysis_limit": -1}'::jsonb
  )
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  currency = EXCLUDED.currency,
  billing_period = EXCLUDED.billing_period,
  billing_interval = EXCLUDED.billing_interval,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Update subscription constraints to allow new plan IDs
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_id_check
  CHECK (plan_id = ANY (ARRAY['free'::text, 'pro-monthly'::text, 'pro-yearly'::text, 'premium-monthly'::text, 'premium-yearly'::text]) OR plan_id IS NULL);

-- Add reminder_sent_at column for manual payment reminder system
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;
