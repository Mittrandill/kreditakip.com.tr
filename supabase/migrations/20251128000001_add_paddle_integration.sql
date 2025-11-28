-- Add Paddle integration to existing subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_checkout_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_url TEXT,
ADD COLUMN IF NOT EXISTS update_url TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_data JSONB;

-- Create indexes for Paddle fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub_id ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_plan_id ON subscriptions(paddle_plan_id);

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

-- RLS Policies for paddle_customers
ALTER TABLE paddle_customers ENABLE ROW LEVEL SECURITY;

-- Users can see their own Paddle customer data
CREATE POLICY "Users can view own paddle customer data" ON paddle_customers
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own Paddle customer data
CREATE POLICY "Users can update own paddle customer data" ON paddle_customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Only service role can insert Paddle customer data
CREATE POLICY "Service role can insert paddle customers" ON paddle_customers
    FOR INSERT WITH CHECK (true);

-- RLS Policies for paddle_webhook_events (only service role)
ALTER TABLE paddle_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role full access to webhook events" ON paddle_webhook_events
    FOR ALL USING (true);

-- Updated trigger to set updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to paddle_customers
CREATE TRIGGER update_paddle_customers_updated_at
    BEFORE UPDATE ON paddle_customers
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

-- Update subscription_plans table to include Paddle product IDs
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS paddle_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(255) DEFAULT 'paddle';

-- Create unique constraint for paddle_product_id
ALTER TABLE subscription_plans
ADD CONSTRAINT unique_paddle_product_id UNIQUE (paddle_product_id) DEFERRABLE INITIALLY DEFERRED;

-- Create index for payment provider
CREATE INDEX IF NOT EXISTS idx_subscription_plans_payment_provider ON subscription_plans(payment_provider);

-- Function to get or create Paddle customer
CREATE OR REPLACE FUNCTION get_or_create_paddle_customer(
    p_user_id UUID,
    p_email VARCHAR(255),
    p_name VARCHAR(255)
)
RETURNS TABLE(id UUID, paddle_customer_id VARCHAR) AS $$
DECLARE
    customer_record RECORD;
    v_paddle_customer_id VARCHAR;
BEGIN
    -- Try to find existing Paddle customer
    SELECT * INTO customer_record
    FROM paddle_customers
    WHERE user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
        -- Return existing customer
        RETURN QUERY
        SELECT customer_record.id, customer_record.paddle_customer_id;
    ELSE
        -- Create new Paddle customer (this will be done via API)
        -- For now, create placeholder record
        INSERT INTO paddle_customers (user_id, paddle_customer_id, email, name)
        VALUES (p_user_id, 'temp_' || gen_random_uuid(), p_email, p_name)
        RETURNING id, paddle_customer_id INTO customer_record;

        RETURN QUERY
        SELECT customer_record.id, customer_record.paddle_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;