-- Complete Paddle Subscription System Migration
-- This migration enhances the existing subscription system with full Paddle integration

-- First, update existing tables to add missing columns for Paddle integration
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR,
ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR,
ADD COLUMN IF NOT EXISTS paddle_plan_id VARCHAR,
ADD COLUMN IF NOT EXISTS paddle_checkout_id VARCHAR,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_plan TEXT,
ADD COLUMN IF NOT EXISTS grace_period_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_payment_action BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_url TEXT,
ADD COLUMN IF NOT EXISTS update_url TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_data JSONB DEFAULT '{}';

-- Update the plan_id constraint to allow more flexible plan IDs
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_updated_at ON subscriptions(status_updated_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_plan ON subscriptions(next_billing_plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_requires_payment_action ON subscriptions(requires_payment_action);

-- Add RLS policies for the new columns (only if they don't exist)
-- Note: These policies assume RLS is already enabled on the table

-- Drop existing policies if they exist (to avoid conflicts)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own subscription details" ON subscriptions;
    DROP POLICY IF EXISTS "Users can update own subscription payment action" ON subscriptions;
END
$$;

-- Users can view their own subscription details
CREATE POLICY "Users can view own subscription details" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own subscription payment action status
CREATE POLICY "Users can update own subscription payment action" ON subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- Update notification preferences to support Paddle email templates
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS subscription_renewal_reminder BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_payment_failed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_canceled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_expired BOOLEAN DEFAULT TRUE;

-- Update invoices table to better handle Paddle invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paddle_transaction_id VARCHAR,
ADD COLUMN IF NOT EXISTS paddle_invoice_id VARCHAR,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR DEFAULT 'paddle',
ADD COLUMN IF NOT EXISTS subscription_reference VARCHAR,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for invoice lookup
CREATE INDEX IF NOT EXISTS idx_invoices_paddle_transaction_id ON invoices(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_paddle_invoice_id ON invoices(paddle_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_provider ON invoices(payment_provider);

-- Update payment_transactions table to handle Paddle transactions
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS paddle_transaction_id VARCHAR,
ADD COLUMN IF NOT EXISTS paddle_order_id VARCHAR,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR DEFAULT 'paddle',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paddle_transaction_id ON payment_transactions(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paddle_order_id ON payment_transactions(paddle_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_provider ON payment_transactions(payment_provider);

-- Create a new table for subscription usage tracking (replaces usage_tracking)
-- This provides better tracking for Paddle integration
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('ocr_analysis', 'risk_analysis')),
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    saved_credits_count INTEGER DEFAULT 0,
    UNIQUE(user_id, feature_type)
);

-- Create indexes for subscription_usage
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_reset_at ON subscription_usage(reset_at);

-- Enable RLS on subscription_usage
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own subscription usage" ON subscription_usage;
    DROP POLICY IF EXISTS "Users can update own subscription usage" ON subscription_usage;
END
$$;

-- RLS policies for subscription_usage
CREATE POLICY "Users can view own subscription usage" ON subscription_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription usage" ON subscription_usage
FOR UPDATE USING (auth.uid() = user_id);

-- Create or update webhook_events table for better Paddle integration
CREATE TABLE IF NOT EXISTS paddle_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL UNIQUE,
    event_type VARCHAR NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_event_id ON paddle_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_event_type ON paddle_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_processed ON paddle_webhook_events(processed);

-- Function to handle subscription status transitions
CREATE OR REPLACE FUNCTION handle_subscription_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status_updated_at when status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.status_updated_at = now();

        -- Handle grace period when subscription expires
        IF OLD.status = 'active' AND NEW.status IN ('expired', 'past_due') THEN
            NEW.grace_period_started_at = now();
            NEW.grace_period_ends_at = now() + interval '7 days';
        END IF;

        -- Clear grace period when subscription becomes active again
        IF NEW.status = 'active' THEN
            NEW.grace_period_started_at = NULL;
            NEW.grace_period_ends_at = NULL;
            NEW.requires_payment_action = FALSE;
            NEW.suspended_at = NULL;
        END IF;

        -- Handle suspension after grace period
        IF NEW.grace_period_ends_at IS NOT NULL AND now() > NEW.grace_period_ends_at AND NEW.status != 'active' THEN
            NEW.status = 'suspended';
            NEW.suspended_at = now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription status transitions
DROP TRIGGER IF EXISTS subscription_status_trigger ON subscriptions;
CREATE TRIGGER subscription_status_trigger
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_status_transition();

-- Function to reset usage limits periodically
CREATE OR REPLACE FUNCTION reset_subscription_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset usage if reset_at is in the past
    IF NEW.reset_at <= now() THEN
        NEW.usage_count = 0;
        NEW.saved_credits_count = 0;
        NEW.reset_at = now() + interval '30 days';
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for usage reset
DROP TRIGGER IF EXISTS subscription_usage_reset_trigger ON subscription_usage;
CREATE TRIGGER subscription_usage_reset_trigger
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION reset_subscription_usage();

-- Function to get current subscription status with grace period consideration
CREATE OR REPLACE FUNCTION get_effective_subscription_status(sub_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    current_status TEXT;
    grace_ends TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT status, grace_period_ends_at
    INTO current_status, grace_ends
    FROM subscriptions
    WHERE id = sub_uuid;

    -- If in grace period and grace period hasn't expired, return 'grace_period'
    IF current_status IN ('expired', 'past_due', 'cancelled')
       AND grace_ends IS NOT NULL
       AND grace_ends > now() THEN
        RETURN 'grace_period';
    END IF;

    RETURN COALESCE(current_status, 'inactive');
END;
$$ LANGUAGE plpgsql;

-- Insert initial subscription plans with Paddle IDs if not exists
INSERT INTO subscription_plans (id, name, description, price, currency, billing_period, billing_interval, features, is_active, is_popular, sort_order, paddle_product_id, paddle_price_id, payment_provider)
VALUES
    ('free', 'Free', 'Ücretsiz kullan, temel özelliklere eriş', 0, 'TRY', 'lifetime', 1,
     '["Temel OCR özellikleri", "Manuel kredi takibi", "Basit raporlar"]',
     true, false, 0, NULL, NULL, 'paddle'),

    ('pro-monthly', 'Pro', 'Aylık 199 TL ile profesyonel özelliklere erişin', 199, 'TRY', 'monthly', 1,
     '["10 adet OCR kredi döküm analizi", "5 adet AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek"]',
     true, false, 1, 'pro_01kb7qyzvy4b36hpn1eqjf5nxv', 'pri_01kb7r1c749c5ec0demkv56g05', 'paddle'),

    ('pro-yearly', 'Pro', 'Yıllık öde, %20 tasarruf et', 1910, 'TRY', 'yearly', 12,
     '["10 adet OCR kredi döküm analizi (aylık)", "5 adet AI Finansal Sağlık Analizi (aylık)", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Yıllık fatura kolaylığı"]',
     true, false, 2, 'pro_01kb7qyzvy4b36hpn1eqjf5nxv', 'pri_01kb7r89wqyhvvzzejybd9meb6', 'paddle'),

    ('premium-monthly', 'Premium', 'Aylık 399 TL ile sınırsız özelliklere erişin', 399, 'TRY', 'monthly', 1,
     '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge"]',
     true, true, 3, 'pro_01kb7ra837dxxjgeabezwr2tpk', 'pri_01kb7rb4ax73c91kg41dzascmd', 'paddle'),

    ('premium-yearly', 'Premium', 'Yıllık öde, %20 tasarruf et', 3830, 'TRY', 'yearly', 12,
     '["Sınırsız OCR kredi döküm analizi", "Sınırsız AI Finansal Sağlık Analizi", "Gelişmiş raporlar", "Reklamsız deneyim", "Öncelikli destek", "Premium badge", "Yıllık fatura kolaylığı"]',
     true, true, 4, 'pro_01kb7ra837dxxjgeabezwr2tpk', 'pri_01kb7rczq5dj86fcq63941dn2m', 'paddle')
ON CONFLICT (id) DO UPDATE SET
    paddle_product_id = EXCLUDED.paddle_product_id,
    paddle_price_id = EXCLUDED.paddle_price_id,
    payment_provider = EXCLUDED.payment_provider;

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'User subscriptions with full Paddle integration';
COMMENT ON COLUMN subscriptions.paddle_subscription_id IS 'Paddle subscription identifier';
COMMENT ON COLUMN subscriptions.paddle_customer_id IS 'Paddle customer identifier';
COMMENT ON COLUMN subscriptions.paddle_plan_id IS 'Paddle price/plan identifier';
COMMENT ON COLUMN subscriptions.grace_period_started_at IS 'Start of grace period after failed payment';
COMMENT ON COLUMN subscriptions.grace_period_ends_at IS 'End of grace period (7 days after start)';
COMMENT ON COLUMN subscriptions.requires_payment_action IS 'Flag for pending payment actions';
COMMENT ON TABLE subscription_usage IS 'Tracks feature usage per subscription';
COMMENT ON TABLE paddle_webhook_events IS 'Stores all Paddle webhook events for processing';

-- Create a view for subscription status including grace period
CREATE OR REPLACE VIEW subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.status,
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.grace_period_started_at,
    s.grace_period_ends_at,
    s.requires_payment_action,
    s.paddle_subscription_id,
    s.paddle_customer_id,
    sp.name as plan_name,
    sp.features
FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;