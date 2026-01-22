-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Vulnerabilities
-- Date: 2026-01-22
--
-- Fixes:
-- 1. profiles: Prevent users from modifying is_admin column
-- 2. payment_transactions: Remove dangerous UPDATE policy
-- 3. newsletter_subscribers: Remove dangerous anon UPDATE policy
-- ============================================================================

-- ============================================================================
-- FIX 1: Prevent users from modifying is_admin on profiles
-- Create a trigger that blocks is_admin changes except by service_role
-- ============================================================================

-- Create function to prevent sensitive profile modifications
CREATE OR REPLACE FUNCTION prevent_sensitive_profile_modifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role to modify anything
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Prevent is_admin modification
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    RAISE EXCEPTION 'Modifying is_admin field is not allowed';
  END IF;

  -- Prevent id modification (should never happen but be safe)
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Modifying id field is not allowed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old triggers if exist and create new one
DROP TRIGGER IF EXISTS prevent_is_admin_modification_trigger ON profiles;
DROP TRIGGER IF EXISTS prevent_sensitive_profile_modifications_trigger ON profiles;

CREATE TRIGGER prevent_sensitive_profile_modifications_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sensitive_profile_modifications();

-- ============================================================================
-- FIX 2: Fix payment_transactions UPDATE policy
-- The current policy allows ANYONE to update ANY transaction
-- ============================================================================

-- Drop the dangerous policy
DROP POLICY IF EXISTS "Service role can update transactions" ON payment_transactions;

-- Create proper policy - only service_role can update
CREATE POLICY "Only service role can update transactions"
  ON payment_transactions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FIX 3: Fix newsletter_subscribers UPDATE policy for anon
-- Currently allows anon to update any subscriber
-- ============================================================================

-- Drop the dangerous policy
DROP POLICY IF EXISTS "Public can update newsletter subscribers" ON newsletter_subscribers;

-- Create proper policy - only service_role can update
CREATE POLICY "Service role can update newsletter subscribers"
  ON newsletter_subscribers
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AUDIT: Log unauthorized admin access attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage audit logs
DROP POLICY IF EXISTS "Only service role can access audit logs" ON security_audit_logs;
CREATE POLICY "Only service role can access audit logs"
  ON security_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON security_audit_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- ============================================================================
-- IMMEDIATE ACTION: Reset any unauthorized admin accounts
-- This query identifies users who may have exploited the vulnerability
-- Run manually to review and fix:
--
-- SELECT id, email, is_admin, created_at, updated_at
-- FROM profiles
-- WHERE is_admin = true
-- ORDER BY updated_at DESC;
-- ============================================================================

COMMENT ON TABLE security_audit_logs IS 'Logs security-related events for audit purposes';
