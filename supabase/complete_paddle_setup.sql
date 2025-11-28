-- Complete Paddle Integration Setup
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- STEP 1: Check existing table structure
-- =====================================================

-- First, let's see what columns exist in subscription_plans
-- (This is just for debugging, will be commented out after)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: Add missing columns to subscriptions table
-- =====================================================

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_checkout_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_url TEXT,
ADD COLUMN IF NOT EXISTS update_url TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_data JSONB;

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub_id ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_plan_id ON subscriptions(paddle_plan_id);

-- =====================================================
-- STEP 3: Create new Paddle tables
-- =====================================================

-- Create paddle_customers table
CREATE TABLE IF NOT EXISTS paddle_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    paddle_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    country VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for paddle_customers
CREATE INDEX IF NOT EXISTS idx_paddle_customers_user_id ON paddle_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_paddle_customers_paddle_id ON paddle_customers(paddle_customer_id);

-- Create paddle_webhook_events table for logging
CREATE TABLE IF NOT EXISTS paddle_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_event_id ON paddle_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_event_type ON paddle_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_processed ON paddle_webhook_events(processed);

-- =====================================================
-- STEP 4: Add Paddle columns to subscription_plans
-- =====================================================

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS paddle_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(255) DEFAULT 'paddle';

-- =====================================================
-- STEP 5: Update plans with Paddle IDs
-- =====================================================

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

-- =====================================================
-- STEP 6: Set up RLS policies (simplified)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE paddle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create simple policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view own paddle customer data" ON paddle_customers;
DROP POLICY IF EXISTS "Users can update own paddle customer data" ON paddle_customers;
DROP POLICY IF EXISTS "Service role can insert paddle customers" ON paddle_customers;

CREATE POLICY "Users can view own paddle customer data" ON paddle_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own paddle customer data" ON paddle_customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert paddle customers" ON paddle_customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to webhook events" ON paddle_webhook_events;

CREATE POLICY "Service role full access to webhook events" ON paddle_webhook_events
    FOR ALL USING (true);

-- =====================================================
-- STEP 7: Verification queries
-- =====================================================

-- Check if columns were added successfully
SELECT
    'subscription_plans' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
    AND column_name IN ('paddle_product_id', 'paddle_price_id', 'payment_provider')
UNION ALL
SELECT
    'subscriptions' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
    AND column_name LIKE '%paddle%'
ORDER BY table_name, column_name;

-- Verify the plan updates
SELECT
    id,
    name,
    price,
    billing_interval,
    paddle_product_id,
    paddle_price_id,
    payment_provider,
    is_active
FROM subscription_plans
WHERE id IN ('pro-monthly', 'pro-yearly', 'premium-monthly', 'premium-yearly')
ORDER BY price;