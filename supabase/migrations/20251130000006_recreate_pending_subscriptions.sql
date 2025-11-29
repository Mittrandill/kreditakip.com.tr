-- Migration: Recreate pending_subscriptions for Paddle
-- Purpose: Restore pending_subscriptions table that was incorrectly dropped
-- Date: 2025-11-30
--
-- Background:
-- - Migration 20251130000003 dropped pending_subscriptions thinking it was PayTR-only
-- - But it's needed for Paddle checkout flow:
--   1. create-checkout creates pending record
--   2. webhook updates to "completed" when payment succeeds
--
-- This table is REQUIRED for Paddle, not legacy!

-- =============================================================================
-- Create pending_subscriptions table (Paddle version)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pending_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'expired'::text])),
  subscription_reference text,
  token text UNIQUE,
  expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT pending_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT pending_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_user_id
  ON pending_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_token
  ON pending_subscriptions(token);

CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_status
  ON pending_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_expires_at
  ON pending_subscriptions(expires_at);

-- =============================================================================
-- Enable RLS
-- =============================================================================
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending subscriptions
CREATE POLICY "Users can view their own pending subscriptions"
  ON pending_subscriptions
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- Users can insert their own pending subscriptions
CREATE POLICY "Users can insert their own pending subscriptions"
  ON pending_subscriptions
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending subscriptions
CREATE POLICY "Users can update their own pending subscriptions"
  ON pending_subscriptions
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

-- Users can delete their own pending subscriptions
CREATE POLICY "Users can delete their own pending subscriptions"
  ON pending_subscriptions
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role can manage all pending subscriptions"
  ON pending_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Add table comment
-- =============================================================================
COMMENT ON TABLE pending_subscriptions IS
'Tracks pending Paddle checkout sessions.
Used in checkout flow:
1. create-checkout creates pending record with token
2. User redirected to Paddle checkout
3. Webhook updates status to completed/failed
4. Expired records cleaned up after 1 hour

This is NOT a PayTR legacy table - it is actively used for Paddle!';

-- =============================================================================
-- Create cleanup function for expired records
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_pending_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM pending_subscriptions
  WHERE status = 'pending'
    AND expires_at < now()
    AND created_at < now() - interval '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_pending_subscriptions() IS
'Cleans up expired pending subscriptions that are older than 24 hours.
Should be run periodically via cron job.';

-- =============================================================================
-- Verification
-- =============================================================================
SELECT
  'pending_subscriptions' as table_name,
  'created' as status,
  COUNT(*) as row_count
FROM pending_subscriptions;
