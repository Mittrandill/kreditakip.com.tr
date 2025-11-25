-- ============================================================================
-- DEBUG: Kullanıcının mevcut durumunu kontrol et
-- ============================================================================
-- Bu sorguyu çalıştırarak free kullanıcının risk analizi yapıp yapamayacağını görebilirsiniz

-- 1. Kullanıcının subscription bilgisi
SELECT
  id,
  user_id,
  plan_type,
  status,
  expires_at
FROM subscriptions
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Kullanıcının usage_tracking bilgisi
SELECT
  user_id,
  feature_type,
  used_count,
  limit_count,
  saved_credits_count,
  reset_at
FROM usage_tracking
ORDER BY created_at DESC
LIMIT 10;

-- 3. can_use_feature fonksiyonunu test et (kendi user_id'nizi buraya yazın)
-- SELECT public.can_use_feature('YOUR-USER-ID-HERE', 'risk_analysis');

-- 4. Free kullanıcı risk analizi yapabilir mi kontrolü
SELECT
  p.id as user_id,
  p.email,
  s.plan_type,
  ut.feature_type,
  ut.used_count,
  ut.limit_count,
  CASE
    WHEN s.plan_type = 'premium' THEN 'ALLOWED (Premium)'
    WHEN ut.used_count < ut.limit_count THEN 'ALLOWED (Under limit)'
    ELSE 'BLOCKED (Limit exceeded)'
  END as can_use_status,
  ut.used_count || '/' || ut.limit_count as usage
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status = 'active'
LEFT JOIN usage_tracking ut ON ut.user_id = p.id AND ut.feature_type = 'risk_analysis'
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Eğer limit_count = 0 görüyorsanız, migration henüz çalıştırılmamış demektir
-- Migration'ı çalıştırmak için: 20251125120000_setup_user_initialization_and_usage_tracking.sql
