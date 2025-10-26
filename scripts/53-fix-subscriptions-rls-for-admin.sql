-- Fix subscriptions table RLS for admin access
-- This allows admin users to read all subscriptions when querying through profiles

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Admin can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin users can view ALL subscriptions
CREATE POLICY "Admin can view all subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 2: Regular users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Users can insert their own subscriptions (for payment flow)
CREATE POLICY "Users can insert own subscriptions"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 5: Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY policyname;
