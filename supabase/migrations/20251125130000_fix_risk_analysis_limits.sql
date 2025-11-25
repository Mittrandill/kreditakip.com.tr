-- ============================================================================
-- HIZLI FİX: Risk Analizi Limitlerini Düzelt
-- ============================================================================
-- Bu migration risk analizi limitlerini 0'dan 1'e günceller
-- Free kullanıcılar 1 kez risk analizi yapabilir
-- ============================================================================

-- Tüm free kullanıcıların risk analizi limitini 1 yap
UPDATE public.usage_tracking ut
SET
  limit_count = 1,
  updated_at = NOW()
WHERE ut.feature_type = 'risk_analysis'
  AND ut.limit_count = 0
  -- Sadece free kullanıcıları güncelle (premium olanları dokunma)
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = ut.user_id
    AND s.status = 'active'
    AND s.plan_type = 'premium'
  );

-- Eksik kayıtları oluştur (eğer yoksa)
INSERT INTO public.usage_tracking (
  user_id,
  feature_type,
  used_count,
  limit_count,
  saved_credits_count,
  reset_at
)
SELECT
  p.id,
  'risk_analysis',
  0,
  1, -- Free users can use risk analysis once
  0,
  NOW() + INTERVAL '30 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.usage_tracking ut
  WHERE ut.user_id = p.id
  AND ut.feature_type = 'risk_analysis'
)
ON CONFLICT (user_id, feature_type) DO NOTHING;

-- Sonuçları kontrol et
SELECT
  'Risk Analysis Limits Fixed' as message,
  COUNT(*) as affected_users
FROM public.usage_tracking
WHERE feature_type = 'risk_analysis'
  AND limit_count = 1;
