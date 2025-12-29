-- Create billing_info table for storing user billing information
-- This table stores billing details collected during checkout

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON public.billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_email ON public.billing_info(email);

-- Enable RLS
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own billing info" ON public.billing_info
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own billing info" ON public.billing_info
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing info" ON public.billing_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to billing info" ON public.billing_info
    FOR ALL USING (true);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_billing_info_updated_at
    BEFORE UPDATE ON public.billing_info
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add helpful comment
COMMENT ON TABLE public.billing_info IS 'Stores user billing information collected during checkout for invoice generation and payment processing';
