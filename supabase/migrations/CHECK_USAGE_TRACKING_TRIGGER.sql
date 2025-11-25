-- Check if initialize_free_tier trigger exists and is working
SELECT
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND t.tgname = 'on_user_created_initialize_free_tier';

-- Check the function
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'initialize_free_tier';

-- Check users without usage tracking
SELECT
  p.id,
  p.email,
  p.first_name,
  p.created_at,
  COUNT(ut.id) as usage_tracking_count
FROM profiles p
LEFT JOIN usage_tracking ut ON ut.user_id = p.id
GROUP BY p.id, p.email, p.first_name, p.created_at
HAVING COUNT(ut.id) = 0
ORDER BY p.created_at DESC;
