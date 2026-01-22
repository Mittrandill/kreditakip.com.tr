-- ============================================================================
-- SECURITY AUDIT: Check for Unauthorized Admin Accounts
-- Run this in Supabase SQL Editor IMMEDIATELY
-- Date: 2026-01-22
-- ============================================================================

-- 1. List ALL admin accounts with their creation and update times
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.is_admin,
  p.created_at,
  p.updated_at,
  u.created_at as auth_created_at,
  u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true
ORDER BY p.updated_at DESC;

-- 2. Check for suspicious activity - profiles updated recently where is_admin changed
-- This helps identify potential exploitation
SELECT
  p.id,
  p.email,
  p.is_admin,
  p.updated_at,
  p.created_at
FROM profiles p
WHERE p.updated_at > p.created_at + interval '1 minute'
  AND p.is_admin = true
ORDER BY p.updated_at DESC;

-- 3. Count total admins (should be a small, known number)
SELECT COUNT(*) as total_admin_count
FROM profiles
WHERE is_admin = true;

-- ============================================================================
-- TO REVOKE UNAUTHORIZED ADMIN ACCESS:
-- Replace 'USER_ID_HERE' with the actual user ID
-- ============================================================================

-- UPDATE profiles SET is_admin = false WHERE id = 'USER_ID_HERE';

-- ============================================================================
-- TO REVOKE ALL ADMIN ACCESS EXCEPT SPECIFIC USERS:
-- Replace the IDs with your legitimate admin user IDs
-- ============================================================================

-- UPDATE profiles
-- SET is_admin = false
-- WHERE is_admin = true
-- AND id NOT IN (
--   'LEGITIMATE_ADMIN_ID_1',
--   'LEGITIMATE_ADMIN_ID_2'
-- );
