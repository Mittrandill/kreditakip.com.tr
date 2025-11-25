-- Create billing_info table for storing user billing information
CREATE TABLE IF NOT EXISTS billing_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Türkiye',
  tax_number TEXT,
  tax_office TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_info(user_id);

-- Enable Row Level Security
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own billing info
CREATE POLICY "Users can view own billing info"
  ON billing_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own billing info
CREATE POLICY "Users can insert own billing info"
  ON billing_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own billing info
CREATE POLICY "Users can update own billing info"
  ON billing_info
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own billing info
CREATE POLICY "Users can delete own billing info"
  ON billing_info
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_billing_info_updated_at_trigger
  BEFORE UPDATE ON billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_info_updated_at();

-- Add comment to table
COMMENT ON TABLE billing_info IS 'Stores user billing information for premium subscriptions and payments';
