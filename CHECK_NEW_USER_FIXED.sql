-- Yeni kullanıcının veritabanında kontrolü (DÜZELTILMIŞ)
-- User ID: cacde950-ba89-479e-8797-48ed4934c7bd

-- 1. Profiles tablosunda var mı?
SELECT
    'PROFILES' as tablo,
    id,
    email,
    first_name,
    last_name,
    created_at
FROM profiles
WHERE id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- 2. Subscriptions tablosunda var mı?
SELECT
    'SUBSCRIPTIONS' as tablo,
    id,
    user_id,
    plan_id,
    plan_type,
    status,
    start_date,
    expires_at,
    created_at,
    deleted_at,
    CASE
        WHEN deleted_at IS NOT NULL THEN '🗑️ SOFT DELETED'
        ELSE '✅ ACTIVE'
    END as deletion_status
FROM subscriptions
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd'
ORDER BY created_at DESC;

-- 3. Pending subscriptions'da var mı?
SELECT
    'PENDING_SUBSCRIPTIONS' as tablo,
    id,
    user_id,
    plan_id,
    status,
    created_at
FROM pending_subscriptions
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- 4. Usage tracking'de var mı?
SELECT
    'USAGE_TRACKING' as tablo,
    id,
    user_id,
    feature_type,
    used_count,
    limit_count,
    reset_at,
    created_at
FROM usage_tracking
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd'
ORDER BY feature_type;

-- 5. Paddle customers'da var mı?
SELECT
    'PADDLE_CUSTOMERS' as tablo,
    id,
    user_id,
    paddle_customer_id,
    email,
    created_at
FROM paddle_customers
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- 6. Auth.users tablosunda var mı?
SELECT
    'AUTH_USERS' as tablo,
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- ============================================================================
-- ÖZET: Kaç subscription var? (silinmiş dahil)
-- ============================================================================
SELECT
    COUNT(*) as toplam_subscription,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as aktif_subscription,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as silinmis_subscription,
    COUNT(*) FILTER (WHERE plan_type = 'premium') as premium_subscription,
    COUNT(*) FILTER (WHERE plan_type = 'free') as free_subscription
FROM subscriptions
WHERE user_id = 'cacde950-ba89-479e-8797-48ed4934c7bd';

-- ============================================================================
-- TRIGGER KONTROLÜ: Otomatik subscription oluşturan trigger var mı?
-- ============================================================================
SELECT
    trigger_name,
    event_manipulation as ne_zaman,
    event_object_table as hangi_tablo,
    action_timing as timing,
    action_statement as ne_yapiyor
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND (
        event_object_table IN ('profiles', 'subscriptions')
        OR action_statement LIKE '%subscription%'
    )
ORDER BY event_object_table, trigger_name;
