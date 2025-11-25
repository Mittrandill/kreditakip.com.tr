-- Fix RLS policies for invoices and payment_transactions tables

-- ========================================
-- INVOICES TABLE RLS
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Admin can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Service role can manage all invoices" ON invoices;

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own invoices
CREATE POLICY "Users can view own invoices"
ON invoices
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Admin users can view ALL invoices
CREATE POLICY "Admin can view all invoices"
ON invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 3: Service role can do everything
CREATE POLICY "Service role can manage all invoices"
ON invoices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- PAYMENT_TRANSACTIONS TABLE RLS
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON payment_transactions;

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON payment_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Admin users can view ALL transactions
CREATE POLICY "Admin can view all transactions"
ON payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 4: Service role can do everything
CREATE POLICY "Service role can manage all transactions"
ON payment_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT 'Invoices Policies:' as table_name;
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'invoices'
ORDER BY policyname;

SELECT 'Payment Transactions Policies:' as table_name;
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'payment_transactions'
ORDER BY policyname;
