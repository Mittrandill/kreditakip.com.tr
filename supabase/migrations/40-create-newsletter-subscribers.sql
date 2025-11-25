-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- Add RLS policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policies - API uses service role key which bypasses RLS
-- Allow service role (API) to do everything
CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access to check if email exists (for the API)
CREATE POLICY "Public can read newsletter subscribers"
  ON newsletter_subscribers
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert (for new subscriptions via API)
CREATE POLICY "Public can insert newsletter subscribers"
  ON newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public update (for reactivating subscriptions via API)
CREATE POLICY "Public can update newsletter subscribers"
  ON newsletter_subscribers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
