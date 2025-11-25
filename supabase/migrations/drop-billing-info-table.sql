-- Drop billing_info table as billing information is now stored in pending_payments.metadata
-- Run this in Supabase SQL Editor

-- Drop the table
DROP TABLE IF EXISTS billing_info CASCADE;

-- Verification: Check if table is dropped
-- You should see an error "relation does not exist" which confirms deletion
SELECT * FROM billing_info LIMIT 1;
