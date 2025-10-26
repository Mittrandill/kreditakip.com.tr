-- Test RLS policies for a specific user
-- Replace 'USER_ID_HERE' with actual user ID from profiles table

-- Get a test user ID (replace with actual user)
SELECT id, email FROM profiles LIMIT 1;

-- Check invoices for user (should work with RLS)
-- Run this as the authenticated user, not as postgres superuser
SELECT * FROM invoices WHERE user_id = 'USER_ID_HERE';

-- Check payment_transactions for user (should work with RLS)
SELECT * FROM payment_transactions WHERE user_id = 'USER_ID_HERE';

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('invoices', 'payment_transactions');

-- Check current policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('invoices', 'payment_transactions')
ORDER BY tablename, policyname;
