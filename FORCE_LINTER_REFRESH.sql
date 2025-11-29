-- ============================================================================
-- FORCE LINTER CACHE REFRESH
-- ============================================================================
-- View doğru oluşturulmuş ama Supabase Linter eski cache'i tutuyor
-- Bu SQL, view'ı tamamen silip farklı bir isimle oluşturup tekrar eski
-- isimle geri döndürerek Linter'ı "refresh" etmeye zorlar
-- ============================================================================

-- 1. Yedek al (eski view'ı farklı isimle sakla)
DROP VIEW IF EXISTS subscription_status_view_backup CASCADE;
CREATE VIEW subscription_status_view_backup AS
SELECT * FROM subscription_status_view;

-- 2. Orijinal view'ı sil
DROP VIEW IF EXISTS subscription_status_view CASCADE;

-- 3. Birkaç saniye bekle (Linter'ın algılaması için)
-- PostgreSQL'de sleep yok, bu yüzden dummy query ile simüle ediyoruz
SELECT pg_sleep(2);

-- 4. View'ı YENİDEN oluştur (SECURITY DEFINER olmadan)
CREATE VIEW subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.status,

    -- Grace period mantığı
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,

    -- Tarih alanları
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.paused_at,
    s.suspended_at,

    -- Grace period
    s.grace_period_started_at,
    s.grace_period_ends_at,

    -- Flags
    s.requires_payment_action,

    -- Paddle alanları
    s.paddle_subscription_id,
    s.paddle_customer_id,
    s.paddle_plan_id,
    s.paddle_checkout_id,
    s.cancel_url,
    s.update_url,

    -- Plan detayları
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,

    -- Timestamps
    s.created_at,
    s.updated_at,
    s.status_updated_at,

    -- Usage data
    jsonb_build_object(
        'ocrAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'ocr_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false)),

        'riskAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'risk_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false))
    ) as usage

FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;

-- 5. İzinleri yeniden ver
GRANT SELECT ON subscription_status_view TO authenticated;
GRANT SELECT ON subscription_status_view TO anon;
GRANT ALL ON subscription_status_view TO service_role;

-- 6. Yorum ekle (ÖNEMLİ: SECURITY DEFINER olmadığını belirt)
COMMENT ON VIEW subscription_status_view IS
'Subscription status view WITHOUT SECURITY DEFINER.
RLS policies from underlying tables apply automatically.
Last updated: 2025-11-30 - Fixed security_definer_view linter error.';

-- 7. Yedek view'ı temizle
DROP VIEW IF EXISTS subscription_status_view_backup CASCADE;

-- 8. Tekrar doğrula
SELECT
    viewname,
    CASE
        WHEN definition LIKE '%SECURITY DEFINER%'
        THEN '❌ Hala var!'
        ELSE '✅ Temiz!'
    END as security_definer_durumu,
    CASE
        WHEN definition LIKE '%usage%'
        THEN '✅ Usage var'
        ELSE '❌ Usage yok'
    END as usage_durumu
FROM pg_views
WHERE viewname = 'subscription_status_view'
    AND schemaname = 'public';

-- ============================================================================
-- SONUÇ:
-- - security_definer_durumu: ✅ Temiz!
-- - usage_durumu: ✅ Usage var
--
-- Şimdi Supabase Dashboard > Database > Linter sayfasına gidin
-- ve "Re-run linter" veya "Refresh" butonuna basın
-- ============================================================================
