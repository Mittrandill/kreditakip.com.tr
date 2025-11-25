-- Bu sorguyu Supabase SQL Editor'da çalıştırarak trigger'ın olup olmadığını kontrol edin

-- 1. Trigger kontrolü
SELECT
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- 2. Profili olmayan kullanıcıları kontrol et
SELECT
  au.id,
  au.email,
  au.created_at,
  p.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
