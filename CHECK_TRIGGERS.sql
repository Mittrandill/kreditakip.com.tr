-- Kritik trigger'ların içeriğini kontrol et

-- 1. on_user_created_initialize_free_tier fonksiyonunu göster
SELECT
    'on_user_created_initialize_free_tier' as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'on_user_created_initialize_free_tier';

-- 2. on_profile_created_initialize_user fonksiyonunu göster
SELECT
    'on_profile_created_initialize_user' as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'on_profile_created_initialize_user';

-- 3. Bu fonksiyonlar hangi planı oluşturuyor?
-- Fonksiyon kaynak kodlarını daha okunaklı göster
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
WHERE p.proname IN (
    'on_user_created_initialize_free_tier',
    'on_profile_created_initialize_user'
)
ORDER BY p.proname;
