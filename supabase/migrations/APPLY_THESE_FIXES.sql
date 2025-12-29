-- ============================================================================
-- CONSOLIDATED FIX FOR PRO SUBSCRIPTION ISSUES
-- ============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Pro Plan Support
-- ============================================================================

-- Step 1: Drop and recreate plan_type check constraint to include 'pro'
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_type_check
CHECK (plan_type = ANY (ARRAY[
  'free'::text,
  'pro'::text,
  'premium'::text
]));

-- Step 2: Mark old canceled subscriptions as deleted to prevent duplicates
UPDATE public.subscriptions
SET deleted_at = COALESCE(canceled_at, updated_at)
WHERE status = 'canceled'
  AND deleted_at IS NULL
  AND canceled_at IS NOT NULL;

-- Step 3: Fix plan_type for Pro subscriptions
UPDATE public.subscriptions
SET
  plan_type = 'pro',
  updated_at = NOW()
WHERE (plan_id = 'pro-monthly' OR plan_id = 'pro-yearly')
  AND plan_type != 'pro'
  AND deleted_at IS NULL;

-- Step 4: Ensure Premium subscriptions have correct plan_type
UPDATE public.subscriptions
SET
  plan_type = 'premium',
  updated_at = NOW()
WHERE (plan_id = 'premium-monthly' OR plan_id = 'premium-yearly')
  AND plan_type != 'premium'
  AND deleted_at IS NULL;

-- Step 5: Fix subscription_usage limits for Pro users
UPDATE public.subscription_usage su
SET
  limit_count = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 10
    WHEN su.feature_type = 'risk_analysis' THEN 5
    ELSE su.limit_count
  END,
  saved_credits_limit = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 10
    ELSE su.saved_credits_limit
  END,
  updated_at = NOW()
FROM public.subscriptions s
WHERE su.user_id = s.user_id
  AND s.plan_type = 'pro'
  AND s.status = 'active'
  AND s.deleted_at IS NULL
  AND (
    (su.feature_type = 'ocr_analysis' AND su.limit_count != 10)
    OR (su.feature_type = 'risk_analysis' AND su.limit_count != 5)
  );

-- Step 6: Fix Premium users' limits
UPDATE public.subscription_usage su
SET
  limit_count = 999999,
  saved_credits_limit = CASE
    WHEN su.feature_type = 'ocr_analysis' THEN 999999
    ELSE su.saved_credits_limit
  END,
  updated_at = NOW()
FROM public.subscriptions s
WHERE su.user_id = s.user_id
  AND s.plan_type = 'premium'
  AND s.status = 'active'
  AND s.deleted_at IS NULL
  AND su.limit_count != 999999;

-- ============================================================================
-- PART 2: Create set_updated_at Function (if not exists)
-- ============================================================================

-- Create the function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: Create billing_info Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Turkey',
    tax_number VARCHAR(50),
    tax_office VARCHAR(255),
    identity_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_billing_info UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON public.billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_email ON public.billing_info(email);

ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing info" ON public.billing_info;
CREATE POLICY "Users can view own billing info" ON public.billing_info
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own billing info" ON public.billing_info;
CREATE POLICY "Users can update own billing info" ON public.billing_info
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own billing info" ON public.billing_info;
CREATE POLICY "Users can insert own billing info" ON public.billing_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to billing info" ON public.billing_info;
CREATE POLICY "Service role full access to billing info" ON public.billing_info
    FOR ALL USING (true);

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_billing_info_updated_at'
    ) THEN
        CREATE TRIGGER update_billing_info_updated_at
            BEFORE UPDATE ON public.billing_info
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- ============================================================================
-- PART 4: Verification Queries (run after migration to check results)
-- ============================================================================

-- Check plan_type distribution
SELECT
    plan_id,
    plan_type,
    status,
    COUNT(*) as count
FROM public.subscriptions
WHERE deleted_at IS NULL
GROUP BY plan_id, plan_type, status
ORDER BY plan_id;

-- Check Pro user limits
SELECT
    su.feature_type,
    su.limit_count,
    su.saved_credits_limit,
    s.plan_type,
    s.plan_id
FROM public.subscription_usage su
JOIN public.subscriptions s ON su.user_id = s.user_id
WHERE s.plan_type = 'pro'
  AND s.status = 'active'
  AND s.deleted_at IS NULL;

-- Check billing_info table
SELECT COUNT(*) as total_billing_records FROM public.billing_info;

-- ============================================================================
-- SUCCESS!
-- All fixes have been applied. You should see:
-- 1. Pro subscriptions with plan_type = 'pro' (not 'premium')
-- 2. Pro users with OCR limit = 10, Risk Analysis limit = 5
-- 3. Premium users with unlimited (999999) limits
-- 4. billing_info table created and ready to store billing information
-- ============================================================================
