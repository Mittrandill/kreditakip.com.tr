-- Create subscription_plans table for centralized plan management
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'premium-monthly', 'premium-yearly', etc.
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- For showing discounts
  currency TEXT DEFAULT 'TRY',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')),
  billing_interval INTEGER DEFAULT 1, -- 1 month, 12 months, etc.
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Extra data like discount percentage, labels, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current plans
INSERT INTO public.subscription_plans (id, name, description, price, original_price, billing_period, billing_interval, features, is_popular, sort_order, metadata)
VALUES
  (
    'premium-monthly',
    'Aylık Premium',
    'Aylık ödeme ile premium özelliklere erişin',
    199.00,
    NULL,
    'monthly',
    1,
    '["Sınırsız OCR analizi", "Detaylı risk analizi", "Gelişmiş raporlar", "Şifre yönetimi", "Reklamsız deneyim", "Öncelikli destek"]'::jsonb,
    false,
    1,
    '{"period_label": "Aylık"}'::jsonb
  ),
  (
    'premium-yearly',
    'Yıllık Premium',
    'Yıllık öde, 2 ay bedava kazan!',
    1990.00,
    2388.00,
    'yearly',
    12,
    '["Sınırsız OCR analizi", "Detaylı risk analizi", "Gelişmiş raporlar", "Şifre yönetimi", "Reklamsız deneyim", "Öncelikli destek", "2 ay bedava", "Yıllık fatura kolaylığı"]'::jsonb,
    true,
    2,
    '{"period_label": "Yıllık", "discount": "%17 İndirim"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  billing_period = EXCLUDED.billing_period,
  billing_interval = EXCLUDED.billing_interval,
  features = EXCLUDED.features,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Add foreign key to subscriptions table
-- First, ensure all existing subscriptions have valid plan_id
UPDATE public.subscriptions
SET plan_id = 'premium-monthly'
WHERE plan_type = 'premium' AND plan_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
ON DELETE RESTRICT;

-- Add plan_id to payment_transactions for historical tracking
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Update existing transactions with plan_id based on amount
UPDATE public.payment_transactions pt
SET plan_id = CASE
  WHEN pt.amount >= 1900 THEN 'premium-yearly'
  WHEN pt.amount > 0 AND pt.amount < 1900 THEN 'premium-monthly'
  ELSE NULL
END
WHERE pt.plan_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON public.subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON public.payment_transactions(plan_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Centralized subscription plan definitions';
COMMENT ON COLUMN public.subscription_plans.id IS 'Unique plan identifier used as foreign key';
COMMENT ON COLUMN public.subscription_plans.price IS 'Current price in specified currency';
COMMENT ON COLUMN public.subscription_plans.original_price IS 'Original price before discount (optional)';
COMMENT ON COLUMN public.subscription_plans.features IS 'JSON array of feature strings';
COMMENT ON COLUMN public.subscription_plans.metadata IS 'Additional plan metadata (discount labels, etc.)';
COMMENT ON COLUMN public.subscription_plans.is_active IS 'Whether plan is available for new subscriptions';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON public.subscription_plans TO anon, authenticated;
-- GRANT ALL ON public.subscription_plans TO service_role;

-- View to easily see plan details
CREATE OR REPLACE VIEW public.subscription_plans_view AS
SELECT
  id,
  name,
  description,
  price,
  original_price,
  CASE
    WHEN original_price IS NOT NULL AND original_price > price
    THEN ROUND(((original_price - price) / original_price * 100)::numeric, 0)
    ELSE NULL
  END as discount_percentage,
  currency,
  billing_period,
  billing_interval,
  features,
  is_active,
  is_popular,
  sort_order,
  metadata,
  created_at,
  updated_at
FROM public.subscription_plans
WHERE is_active = true
ORDER BY sort_order;

COMMENT ON VIEW public.subscription_plans_view IS 'Active subscription plans with calculated discount percentage';
