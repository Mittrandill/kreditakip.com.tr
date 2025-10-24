# PCI-DSS Veritabanı Entegrasyon Kontrol Listesi

## 📋 Ön Gereksinimler

Bu checklist'i **Vercel deployment öncesi** veya **hemen sonrasında** çalıştırın.

---

## ✅ Adım 1: Veritabanı Doğrulaması

### 1.1 Verification Script'i Çalıştır

**Supabase SQL Editor'da çalıştır:**
\`\`\`sql
-- scripts/verify-pci-dss-database.sql dosyasını aç ve tamamını çalıştır
\`\`\`

**Beklenen Sonuçlar:**
- ✅ `pending_payments table`: EXISTS
- ✅ `cleanup_expired_pending_payments function`: EXISTS
- ✅ RLS policies: 3 policy olmalı
- ✅ subscription_plans: En az 2 plan (premium-monthly, premium-yearly)
- ✅ subscriptions columns: `plan_id` EXISTS

### 1.2 Eksik Tablolar İçin

**Eğer `pending_payments` yoksa:**
\`\`\`sql
-- scripts/create-pending-payments-table.sql dosyasını çalıştır
\`\`\`

**Eğer `subscriptions.plan_id` yoksa:**
\`\`\`sql
-- scripts/add-plan-id-to-subscriptions.sql dosyasını çalıştır
\`\`\`

---

## ✅ Adım 2: Subscription Plans Kontrolü

### 2.1 Planları Kontrol Et

**Supabase SQL Editor'da:**
\`\`\`sql
SELECT id, name, price, currency, billing_interval, features
FROM subscription_plans
ORDER BY price;
\`\`\`

**Gerekli planlar:**
| id | name | price | billing_interval |
|----|------|-------|------------------|
| premium-monthly | Premium Aylık | 199 | monthly |
| premium-yearly | Premium Yıllık | 1990 | yearly |

### 2.2 Eksik Plan Varsa Ekle

**Eğer planlar yoksa:**
\`\`\`sql
INSERT INTO subscription_plans (id, name, price, currency, billing_interval, features, is_active)
VALUES
  ('premium-monthly', 'Premium Aylık', 199.00, 'TRY', 'monthly',
   '["Sınırsız OCR analizi", "Risk analizi", "Reklamsız deneyim", "Öncelikli destek"]'::jsonb,
   true),
  ('premium-yearly', 'Premium Yıllık', 1990.00, 'TRY', 'yearly',
   '["Sınırsız OCR analizi", "Risk analizi", "Reklamsız deneyim", "Öncelikli destek", "%17 indirim"]'::jsonb,
   true);
\`\`\`

---

## ✅ Adım 3: Environment Variables

### 3.1 Production Environment'ta Kontrol Et

**Vercel Dashboard → Settings → Environment Variables:**

Gerekli değişkenler:
\`\`\`bash
# Iyzico (Zaten var olmalı)
IYZICO_API_KEY=sandbox-xxx (Production'da gerçek key)
IYZICO_SECRET_KEY=sandbox-xxx (Production'da gerçek secret)
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com (Production'da: https://api.iyzipay.com)

# Application URL (Callback için ZORUNLU!)
NEXT_PUBLIC_APP_URL=https://kreditakip.com.tr

# Supabase (Zaten var olmalı)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SERVICE_ROLE_KEY=eyJxxx...

# Encryption (Güvenlik için)
ENCRYPTION_KEY=your_32_character_encryption_key
CRON_SECRET=your_secure_cron_secret
\`\`\`

### 3.2 Eksik Varsa Ekle

**Önemli:** `NEXT_PUBLIC_APP_URL` mutlaka production domain olmalı!

---

## ✅ Adım 4: Callback URL Test

### 4.1 Callback Endpoint'in Erişilebilir Olduğunu Doğrula

**Test (Production'da):**
\`\`\`bash
curl https://kreditakip.com.tr/api/payment/checkout/callback
\`\`\`

**Beklenen sonuç:**
- HTTP 400 veya 302 (çünkü token yok - bu normal)
- HTTP 404 DEĞİL (404 ise route yok demektir - sorun var!)

### 4.2 Initialize Endpoint Test

\`\`\`bash
curl -X POST https://kreditakip.com.tr/api/payment/checkout/initialize \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
\`\`\`

**Beklenen:**
- HTTP 401 (Unauthorized - auth gerekli - bu normal)
- HTTP 404 DEĞİL

---

## ✅ Adım 5: Expired Payments Cleanup (Opsiyonel)

### 5.1 Manuel Cleanup Function'ı Test Et

**Supabase SQL Editor:**
\`\`\`sql
-- Test: Create expired payment
INSERT INTO pending_payments (user_id, plan_id, amount, currency, token, status, expires_at)
VALUES (
  auth.uid(), -- Senin user ID'n
  'premium-monthly',
  199.00,
  'TRY',
  'test-token-' || gen_random_uuid(),
  'pending',
  NOW() - INTERVAL '2 hours' -- 2 saat önce expire olmuş
);

-- Run cleanup
SELECT cleanup_expired_pending_payments();

-- Verify - status 'expired' olmalı
SELECT * FROM pending_payments WHERE status = 'expired' ORDER BY created_at DESC LIMIT 5;
\`\`\`

### 5.2 Automatic Cleanup (Gelecekte - pg_cron gerekli)

Supabase Pro plan'da pg_cron kullanılabilir:
\`\`\`sql
-- Her 15 dakikada bir expired payment'ları temizle
SELECT cron.schedule(
  'cleanup-expired-payments',
  '*/15 * * * *',
  'SELECT cleanup_expired_pending_payments();'
);
\`\`\`

---

## ✅ Adım 6: İlk Test Payment

### 6.1 Sandbox Test Kartı ile Ödeme Yap

**Kart Bilgileri (Sandbox):**
\`\`\`
Kart No: 5528 7900 0000 0008
Tarih: 12/30
CVV: 123
3D Secure: 123456
\`\`\`

**Test Adımları:**
1. `/uygulama/premium` sayfasına git
2. Premium plan seç
3. Fatura bilgilerini doldur
4. "Güvenli Ödemeye Geç" butonuna tıkla
5. Iyzico sayfasında test kartını gir
6. 3D Secure: 123456
7. Ödemeyi tamamla

**Beklenen:**
- ✅ `/uygulama/ayarlar?payment=success` sayfasına yönlendirilmeli
- ✅ Toast notification: "Ödeme Başarılı!"
- ✅ Subscription status: Premium aktif olmalı

### 6.2 Veritabanını Kontrol Et

**Test sonrası:**
\`\`\`sql
-- Pending payment completed olmalı
SELECT * FROM pending_payments ORDER BY created_at DESC LIMIT 1;
-- status = 'completed' olmalı

-- Subscription created olmalı
SELECT * FROM subscriptions WHERE user_id = 'senin-user-id' ORDER BY created_at DESC LIMIT 1;
-- status = 'active', plan_id = 'premium-monthly' olmalı

-- Usage limit updated olmalı
SELECT * FROM usage_tracking WHERE user_id = 'senin-user-id' AND feature_type = 'ocr_analysis';
-- limit_count = 999999 olmalı (monthly için)
\`\`\`

---

## ✅ Adım 7: Error Handling Test

### 7.1 Failed Payment Test

**Test kartı (başarısız):**
\`\`\`
Kart No: 5406 6754 0667 5403
Tarih: 12/30
CVV: 123
\`\`\`

**Beklenen:**
- ❌ Ödeme başarısız olmalı
- ❌ `/uygulama/ayarlar?payment=failed&reason=...` yönlendirme
- ❌ Toast: "Ödeme Başarısız"
- ❌ Subscription oluşmamalı

### 7.2 Expired Token Test

**Manuel test:**
\`\`\`sql
-- 2 saat önce oluşturulmuş pending payment oluştur
INSERT INTO pending_payments (user_id, plan_id, amount, currency, token, status, created_at, expires_at)
VALUES (
  auth.uid(),
  'premium-monthly',
  199.00,
  'TRY',
  'expired-test-token',
  'pending',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour'
);

-- Callback'i bu token ile çağırmaya çalış (manuel test)
-- Beklenen: "Token expired" hatası
\`\`\`

---

## 📊 Monitoring Queries

### Ödeme Başarı Oranı (Son 7 gün)
\`\`\`sql
SELECT
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric * 100,
    2
  ) as success_rate_percent
FROM pending_payments
WHERE created_at > NOW() - INTERVAL '7 days';
\`\`\`

### Ortalama Ödeme Tamamlanma Süresi
\`\`\`sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as avg_minutes,
  MIN(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as min_minutes,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as max_minutes
FROM pending_payments
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';
\`\`\`

### Terk Edilen Checkout'lar
\`\`\`sql
SELECT COUNT(*)
FROM pending_payments
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND created_at > NOW() - INTERVAL '7 days';
\`\`\`

---

## ✅ Final Checklist

Tüm adımları tamamladıktan sonra:

- [ ] `pending_payments` tablosu var ve RLS aktif
- [ ] `subscription_plans` tablosunda premium-monthly ve premium-yearly var
- [ ] `subscriptions` tablosunda `plan_id` kolonu var
- [ ] Environment variables production'da doğru
- [ ] Callback URL'e erişilebiliyor
- [ ] Test payment başarılı
- [ ] Failed payment doğru handle ediliyor
- [ ] Monitoring query'leri çalışıyor
- [ ] Cleanup function çalışıyor

---

## 🚨 Sorun Giderme

### Sorun: "Plan not found" hatası
**Çözüm:** `subscription_plans` tablosuna plan ekle (Adım 2.2)

### Sorun: "Callback failed" hatası
**Çözüm:** `NEXT_PUBLIC_APP_URL` environment variable'ını kontrol et

### Sorun: Token expire oluyor
**Normal:** Token 1 saat içinde kullanılmalı. Cleanup function otomatik temizleyecek.

### Sorun: Subscription created ama usage limit updated değil
**Kritik değil:** Callback içinde hata logları kontrol et, ama subscription başarılı

---

**Son Güncelleme:** 2025-10-20
**Versiyon:** 1.0.0
