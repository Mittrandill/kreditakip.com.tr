-- =====================================================
-- DATABASE DIAGNOSTICS - Tüm Trigger ve Function'ları Göster
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın ve sonuçları bana gönderin

-- 1. TÜM AUTH TRIGGER'LARI
SELECT
  '=== AUTH TRIGGERS ===' as section,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition,
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
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. TÜM PUBLIC SCHEMA TRIGGER'LARI
SELECT
  '=== PUBLIC TRIGGERS ===' as section,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition,
  CASE t.tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 3. TÜM PUBLIC FUNCTION'LAR
SELECT
  '=== PUBLIC FUNCTIONS ===' as section,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- 4. PROFILES TABLOSU YAPISI
SELECT
  '=== PROFILES TABLE STRUCTURE ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. SUBSCRIPTION_TIERS TABLOSU YAPISI
SELECT
  '=== SUBSCRIPTION_TIERS TABLE STRUCTURE ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_tiers'
ORDER BY ordinal_position;

-- 6. PROFILES'DAKİ RLS POLİCY'LER
SELECT
  '=== PROFILES RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 7. PROFİLİ OLMAYAN KULLANICILAR
SELECT
  '=== USERS WITHOUT PROFILES ===' as section,
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  p.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 8. SON OLUŞTURULAN PROFILLER
SELECT
  '=== RECENT PROFILES ===' as section,
  id,
  email,
  first_name,
  last_name,
  subscription_tier,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 9. SUBSCRIPTION TIERS DATA
SELECT
  '=== SUBSCRIPTION TIERS ===' as section,
  *
FROM public.subscription_tiers
ORDER BY tier_name;

-- 10. DATABASE LOGS (Son kayıt hatalarını görmek için)
SELECT
  '=== RECENT ERRORS ===' as section,
  *
FROM pg_stat_statements
WHERE query LIKE '%handle_new_user%'
   OR query LIKE '%profiles%'
ORDER BY calls DESC
LIMIT 10;
