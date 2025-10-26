-- Fix billing_info RLS policies for admin access
-- This allows admin users to view all billing information

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all billing info" ON billing_info;

-- Create policy for admin users to view ALL billing info
CREATE POLICY "Admin can view all billing info"
ON billing_info FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'billing_info'
ORDER BY policyname;
