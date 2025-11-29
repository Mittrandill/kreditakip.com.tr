-- Tüm subscription ile ilgili fonksiyonları bul

-- 1. Tüm trigger fonksiyonlarını listele
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user%created%'
   OR p.proname LIKE '%initialize%'
   OR p.proname LIKE '%free%tier%'
   OR p.proname LIKE '%subscription%'
ORDER BY p.proname;

-- 2. Profiles tablosundaki trigger'ların detaylarını göster
SELECT
    t.tgname as trigger_name,
    'profiles' as table_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'profiles'
    AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3. Subscriptions tablosundaki trigger'ların detaylarını göster
SELECT
    t.tgname as trigger_name,
    'subscriptions' as table_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'subscriptions'
    AND NOT t.tgisinternal
ORDER BY t.tgname;
