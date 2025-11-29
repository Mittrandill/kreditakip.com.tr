-- Kullanıcı Kontrolü - Paddle Uyumlu
-- User ID: cacde950-ba89-479e-8797-48ed4934c7bd

-- 1. PROFILES
SELECT
    'PROFILES' as tablo,
    id,
    email,
    first_name,
    last_name,
    created_at
FROM profiles
WHERE id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- 2. SUBSCRIPTIONS (en önemli!)
SELECT
    'SUBSCRIPTIONS' as tablo,
    id,
    user_id,
    plan_id,
    plan_type,
    status,
    start_date,
    expires_at,
    paddle_subscription_id,
    created_at,
    deleted_at,
    CASE
        WHEN deleted_at IS NOT NULL THEN '🗑️ SİLİNMİŞ'
        WHEN plan_type = 'premium' THEN '⚠️ PREMİUM (neden?)'
        WHEN plan_type = 'free' THEN '✅ ÜCRETSİZ (doğru)'
        ELSE '❓ BİLİNMEYEN'
    END as durum_analiz
FROM subscriptions
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd'
ORDER BY created_at DESC;

-- 3. USAGE TRACKING
SELECT
    'USAGE_TRACKING' as tablo,
    feature_type,
    used_count,
    limit_count,
    CASE
        WHEN limit_count = 999999 THEN '⚠️ SINIRSIZ (premium özelliği!)'
        WHEN limit_count = 1 THEN '✅ Ücretsiz limit'
        ELSE '❓ Bilinmeyen limit'
    END as limit_analiz,
    created_at
FROM usage_tracking
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd'
ORDER BY feature_type;

-- 4. AUTH USERS
SELECT
    'AUTH_USERS' as tablo,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- ============================================================================
-- ÖZET ANALİZ
-- ============================================================================
SELECT
    '📊 ÖZET' as baslik,
    COUNT(*) as toplam_subscription,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as aktif,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as silinmis,
    COUNT(*) FILTER (WHERE plan_type = 'premium' AND deleted_at IS NULL) as aktif_premium,
    COUNT(*) FILTER (WHERE plan_type = 'free' AND deleted_at IS NULL) as aktif_free,
    CASE
        WHEN COUNT(*) FILTER (WHERE plan_type = 'premium' AND deleted_at IS NULL) > 0
        THEN '⚠️ SORUN: Yeni üye premium ile başladı!'
        WHEN COUNT(*) FILTER (WHERE plan_type = 'free' AND deleted_at IS NULL) > 0
        THEN '✅ NORMAL: Ücretsiz üye'
        WHEN COUNT(*) = 0
        THEN '❌ SORUN: Hiç subscription yok!'
        ELSE '❓ Bilinmeyen durum'
    END as sorun_analiz
FROM subscriptions
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- ============================================================================
-- TRİGGER KONTROLÜ: Otomatik subscription oluşturuyor mu?
-- ============================================================================
SELECT
    '🔍 TRIGGER KONTROLÜ' as baslik,
    trigger_name,
    event_object_table as tablo,
    event_manipulation as ne_zaman,
    CASE
        WHEN action_statement LIKE '%premium%' THEN '⚠️ Premium oluşturuyor!'
        WHEN action_statement LIKE '%subscription%' THEN '✅ Subscription oluşturuyor'
        ELSE 'Normal trigger'
    END as analiz
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND (
        event_object_table IN ('profiles', 'subscriptions', 'users')
        OR action_statement ILIKE '%subscription%'
    )
ORDER BY event_object_table;
