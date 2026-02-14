-- Create admin_action_logs table
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'subscription_create', 'subscription_update', 'subscription_cancel', etc.
  target_type text, -- 'user', 'subscription', 'invoice', etc.
  target_id uuid, -- ID of the affected resource
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- User affected by this action
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_action_logs_target_user_id ON admin_action_logs(target_user_id);
CREATE INDEX idx_admin_action_logs_action_type ON admin_action_logs(action_type);
CREATE INDEX idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);

-- Enable RLS
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all admin action logs"
ON admin_action_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: System can insert logs (service role)
CREATE POLICY "Service role can insert admin action logs"
ON admin_action_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Comment
COMMENT ON TABLE admin_action_logs IS 'Tracks all admin actions for audit trail';
