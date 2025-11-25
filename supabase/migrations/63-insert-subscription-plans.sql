-- Insert default subscription plans

-- Önce mevcut planları temizle (eğer varsa)
DELETE FROM subscription_plans WHERE id IN ('premium-monthly', 'premium-yearly');

-- Aylık plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  original_price,
  currency,
  billing_interval,
  billing_period,
  features,
  is_active,
  is_popular,
  discount_percentage,
  created_at,
  updated_at
) VALUES (
  'premium-monthly',
  'Aylık Premium',
  'Aylık ödeme ile premium özelliklere erişin',
  199.00,
  NULL,
  'TRY',
  'monthly',
  1,
  ARRAY[
    'Sınırsız OCR analizi',
    'Detaylı risk analizi',
    'Gelişmiş raporlar',
    'Şifre yönetimi',
    'Reklamsız deneyim',
    'Öncelikli destek'
  ],
  true,
  false,
  NULL,
  NOW(),
  NOW()
);

-- Yıllık plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  original_price,
  currency,
  billing_interval,
  billing_period,
  features,
  is_active,
  is_popular,
  discount_percentage,
  created_at,
  updated_at
) VALUES (
  'premium-yearly',
  'Yıllık Premium',
  'Yıllık öde, 2 ay bedava kazan!',
  1990.00,
  2388.00,
  'TRY',
  'yearly',
  12,
  ARRAY[
    'Sınırsız OCR analizi',
    'Detaylı risk analizi',
    'Gelişmiş raporlar',
    'Şifre yönetimi',
    'Reklamsız deneyim',
    'Öncelikli destek',
    '2 ay bedava',
    'Yıllık fatura kolaylığı'
  ],
  true,
  true,
  17,
  NOW(),
  NOW()
);

-- Verify
SELECT id, name, price, billing_interval, is_active FROM subscription_plans;
