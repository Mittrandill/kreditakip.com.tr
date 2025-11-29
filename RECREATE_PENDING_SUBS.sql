-- Recreate pending_subscriptions for Paddle (FIXED)
-- Drop existing function first to avoid conflict

-- =============================================================================
-- 1. Create pending_subscriptions table
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
-- 2. Create indexes
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
-- 3. Enable RLS
-- =============================================================================
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can update their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all pending subscriptions" ON pending_subscriptions;

-- Create policies
CREATE POLICY "Users can view their own pending subscriptions"
  ON pending_subscriptions FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending subscriptions"
  ON pending_subscriptions FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending subscriptions"
  ON pending_subscriptions FOR UPDATE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending subscriptions"
  ON pending_subscriptions FOR DELETE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all pending subscriptions"
  ON pending_subscriptions FOR ALL TO service_role
  USING (true);

-- =============================================================================
-- 4. Drop old function and recreate
-- =============================================================================
DROP FUNCTION IF EXISTS cleanup_expired_pending_subscriptions();

CREATE FUNCTION cleanup_expired_pending_subscriptions()
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

-- =============================================================================
-- 5. Add comments
-- =============================================================================
COMMENT ON TABLE pending_subscriptions IS
'Paddle checkout tracking. NOT a PayTR legacy table!';

COMMENT ON FUNCTION cleanup_expired_pending_subscriptions() IS
'Cleans up expired pending subscriptions older than 24 hours.';

-- =============================================================================
-- 6. Verification
-- =============================================================================
SELECT
  '✅ pending_subscriptions' as status,
  COUNT(*) as current_records
FROM pending_subscriptions;
