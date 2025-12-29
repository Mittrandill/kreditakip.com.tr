# 🧪 Staging Test Planı
## usage_tracking → subscription_usage Geçişi

**Tarih:** 29 Aralık 2025
**Amaç:** Kod değişikliklerini staging ortamında test etmek
**Süre:** 2-3 gün
**Sorumlu:** Development Team

---

## 📋 Hazırlık Adımları

### 1. Staging Ortamı Kurulumu

- [ ] **Staging veritabanı oluştur**
  - Production'dan güncel backup al
  - Staging Supabase projesine restore et
  - Veya production'dan SQL dump al

- [ ] **Migrasyon dosyalarını staging'e yükle**
  ```bash
  # Migrasyonları staging'e kopyala
  cp supabase/migrations/20251229*.sql staging-supabase/migrations/
  ```

- [ ] **Environment variables ayarla**
  ```bash
  # .env.staging dosyası oluştur
  NEXT_PUBLIC_SUPABASE_URL=<staging-supabase-url>
  SUPABASE_ANON_KEY=<staging-anon-key>
  SERVICE_ROLE_KEY=<staging-service-role-key>
  CRON_SECRET=<test-cron-secret>
  ```

- [ ] **Staging branch oluştur**
  ```bash
  git checkout -b staging/usage-tracking-migration
  git add .
  git commit -m "feat: migrate usage_tracking to subscription_usage"
  git push origin staging/usage-tracking-migration
  ```

---

## 🔧 Migrasyon Testleri

### Test 1: Migrasyon 1 - Missing Tables

**Amaç:** accounts ve credit_cards tablolarını test et

```sql
-- Staging'de çalıştır
\i supabase/migrations/20251229000001_add_missing_tables.sql
```

**Doğrulama:**
- [ ] accounts tablosu oluştu mu?
- [ ] credit_cards tablosu oluştu mu?
- [ ] RLS politikaları çalışıyor mu?
- [ ] İndeksler oluşturuldu mu?

**Test sorguları:**
```sql
-- Tablo yapısını kontrol et
\d accounts
\d credit_cards

-- RLS politikalarını kontrol et
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE tablename IN ('accounts', 'credit_cards');

-- İndeksleri kontrol et
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('accounts', 'credit_cards');
```

**Beklenen Sonuç:** ✅ Tüm tablolar, politikalar ve indeksler başarıyla oluşturulmuş olmalı

---

### Test 2: Migrasyon 3 - Webhook Cleanup

**Amaç:** Webhook temizlik sistemini test et

```sql
-- Staging'de çalıştır
\i supabase/migrations/20251229000003_add_paytr_webhook_cleanup.sql
```

**Doğrulama:**
- [ ] cleanup_jobs tablosu oluştu mu?
- [ ] cleanup fonksiyonları oluştu mu?
- [ ] İndeksler eklendi mi?

**Manuel test:**
```sql
-- Test webhook'ları ekle (90+ gün önce)
INSERT INTO paytr_webhook_events (order_id, event_type, event_data, processed, created_at)
VALUES
  ('TEST-OLD-1', 'payment_success', '{}', true, NOW() - INTERVAL '100 days'),
  ('TEST-OLD-2', 'payment_success', '{}', true, NOW() - INTERVAL '95 days'),
  ('TEST-NEW-1', 'payment_success', '{}', true, NOW() - INTERVAL '50 days');

-- Temizlik fonksiyonunu çalıştır
SELECT cleanup_old_paytr_webhooks();

-- Sonuçları kontrol et
SELECT COUNT(*) FROM paytr_webhook_events WHERE order_id LIKE 'TEST-%';
-- Beklenen: 1 kayıt (TEST-NEW-1), eski kayıtlar silinmiş olmalı

-- Cleanup log'u kontrol et
SELECT * FROM cleanup_jobs WHERE job_name = 'paytr_webhook_cleanup';
```

**Beklenen Sonuç:** ✅ 90+ gün önceki kayıtlar silinmeli, yeni kayıtlar korunmalı

---

## 🚀 Uygulama Testleri

### Test 3: Kod Değişiklikleri Deployment

**Dağıtım:**
```bash
# Staging'e deploy et
vercel --target staging
# veya
npm run build
npm run start
```

**Doğrulama:**
- [ ] Build başarılı mı?
- [ ] TypeScript hataları var mı?
- [ ] Runtime hataları var mı?

---

### Test 4: Cron Job Testleri

#### 4.1. Subscription Expiry Check

**Test senaryosu:**
```sql
-- Test aboneliği oluştur (süresi dolmuş)
INSERT INTO subscriptions (user_id, plan_id, plan_type, status, expires_at, created_at)
VALUES (
  '<test-user-id>',
  'pro-monthly',
  'premium',
  'active',
  NOW() - INTERVAL '8 days',  -- 8 gün önce dolmuş
  NOW() - INTERVAL '30 days'
)
RETURNING id;
```

**Cron'u manuel tetikle:**
```bash
# Test endpoint'i çağır
curl -X POST https://staging.kreditakip.com.tr/api/cron/subscription-expiry-check \
  -H "Authorization: Bearer <test-cron-secret>"
```

**Beklenen Sonuç:**
- [ ] Abonelik "expired" durumuna geçti mi?
- [ ] plan_type "free" olarak güncellendi mi?
- [ ] subscription_usage'da limitler resetlendi mi?

**Doğrulama sorgusu:**
```sql
SELECT id, plan_type, status, expires_at
FROM subscriptions
WHERE user_id = '<test-user-id>';

SELECT feature_type, usage_count, limit_count
FROM subscription_usage
WHERE user_id = '<test-user-id>';
```

---

#### 4.2. Grace Period Handler

**Test senaryosu:**
```sql
-- Test aboneliği oluştur (grace period için)
INSERT INTO subscriptions (user_id, plan_id, plan_type, status, expires_at, created_at)
VALUES (
  '<test-user-id-2>',
  'premium-monthly',
  'premium',
  'active',
  NOW() - INTERVAL '1 day',  -- Dün dolmuş
  NOW() - INTERVAL '30 days'
)
RETURNING id;
```

**Cron'u manuel tetikle:**
```bash
curl -X POST https://staging.kreditakip.com.tr/api/cron/grace-period-handler \
  -H "Authorization: Bearer <test-cron-secret>"
```

**Beklenen Sonuç:**
- [ ] grace_period_started_at set edildi mi?
- [ ] grace_period_ends_at +3 gün olarak set edildi mi?
- [ ] Email gönderildi mi? (logları kontrol et)

**Doğrulama sorgusu:**
```sql
SELECT
  id,
  status,
  grace_period_started_at,
  grace_period_ends_at,
  EXTRACT(DAY FROM grace_period_ends_at - grace_period_started_at) as grace_days
FROM subscriptions
WHERE user_id = '<test-user-id-2>';
```

---

#### 4.3. Webhook Cleanup

**Cron'u manuel tetikle:**
```bash
curl -X POST https://staging.kreditakip.com.tr/api/cron/webhook-cleanup \
  -H "Authorization: Bearer <test-cron-secret>"
```

**Beklenen Sonuç:**
- [ ] Response JSON doğru mu?
- [ ] cleanup_jobs tablosu güncellendi mi?
- [ ] Eski webhook'lar silindi mi?

**Doğrulama:**
```sql
SELECT * FROM cleanup_jobs ORDER BY last_run_at DESC LIMIT 5;
```

---

### Test 5: Frontend Fonksiyonellik Testleri

#### 5.1. Kullanıcı Ayarları Sayfası

**Test adımları:**
1. Staging'de giriş yap
2. Ayarlar sayfasına git (`/uygulama/ayarlar`)
3. Kullanım limitlerini kontrol et

**Beklenen:**
- [ ] OCR kullanımı gösteriliyor mu?
- [ ] Risk analizi kullanımı gösteriliyor mu?
- [ ] Limitler doğru mu?

---

#### 5.2. Admin Paneli

**Test adımları:**
1. Admin kullanıcısı ile giriş yap
2. Admin paneline git (`/admin`)
3. İstatistikleri kontrol et

**Beklenen:**
- [ ] Kullanıcı sayıları doğru mu?
- [ ] Abonelik istatistikleri doğru mu?
- [ ] Kullanım istatistikleri gösteriliyor mu?

---

#### 5.3. Risk Analizi (accounts/credit_cards testi)

**Test adımları:**
1. Risk analizi sayfasına git
2. Finansal profil doldur
3. Risk analizi oluştur

**Beklenen:**
- [ ] Hata almadan çalışıyor mu?
- [ ] accounts tablosu sorgulanıyor mu?
- [ ] credit_cards tablosu sorgulanıyor mu?

---

## 📊 Performans Testleri

### Test 6: Query Performance

**subscription_usage sorguları:**
```sql
-- Sorgu sürelerini ölç
EXPLAIN ANALYZE
SELECT * FROM subscription_usage WHERE user_id = '<test-user-id>';

EXPLAIN ANALYZE
SELECT * FROM subscription_usage WHERE feature_type = 'ocr_analysis';
```

**Beklenen:** < 10ms response time

---

## 🔍 Monitoring & Logging

### Test 7: Log Analizi

**24 saat boyunca izle:**
- [ ] Error logları var mı?
- [ ] usage_tracking'e erişim girişimi var mı?
- [ ] subscription_usage sorguları başarılı mı?
- [ ] Cron job'lar düzenli çalışıyor mu?

**Log sorguları:**
```bash
# Vercel logs
vercel logs <staging-deployment-url>

# Supabase logs
# Dashboard'dan "Logs" sekmesini kontrol et
```

---

## ✅ Başarı Kriterleri

Aşağıdaki kriterler sağlanmalı:

### Zorunlu (Must-Have)
- [x] Tüm migrasyonlar hatasız çalıştı
- [x] Build ve deployment başarılı
- [x] Kritik cron job'lar çalışıyor (expiry-check, grace-period)
- [ ] Frontend sayfaları hatasız yükleniyor
- [ ] Veri kaybı yok
- [ ] Performans düşüşü yok (< %10)

### Önemli (Should-Have)
- [ ] Webhook cleanup çalışıyor
- [ ] Email bildirimleri gönderiliyor
- [ ] Admin paneli doğru istatistikler gösteriyor
- [ ] Risk analizi çalışıyor

### İsteğe Bağlı (Nice-to-Have)
- [ ] Test coverage %80+
- [ ] Load test başarılı
- [ ] Documentation güncel

---

## 🚨 Sorun Giderme

### Hata Senaryoları

#### Senaryo 1: Migration başarısız

**Belirti:** SQL error

**Çözüm:**
```sql
-- Geri al
-- (Her migration'ın altında rollback scripti var)
```

---

#### Senaryo 2: Cron job çalışmıyor

**Belirti:** Subscription'lar düşürülmüyor

**Kontrol:**
1. CRON_SECRET doğru mu?
2. Vercel cron schedule doğru mu?
3. Endpoint erişilebilir mi?

**Debug:**
```bash
# Manuel trigger
curl -X POST <staging-url>/api/cron/subscription-expiry-check \
  -H "Authorization: Bearer <cron-secret>" \
  -v
```

---

#### Senaryo 3: Frontend hatası

**Belirti:** Sayfa yüklenmiyor veya veri gösterilmiyor

**Kontrol:**
1. Browser console'da hata var mı?
2. API response başarılı mı?
3. RLS politikaları doğru mu?

---

## 📝 Test Raporu Şablonu

Test tamamlandıktan sonra doldurun:

```markdown
# Staging Test Raporu
**Tarih:** _______________
**Test Eden:** _______________

## Sonuçlar
- [ ] Tüm testler başarılı
- [ ] Bazı testler başarısız (detaylar aşağıda)
- [ ] Kritik hata (production'a GİTME)

## Başarısız Testler
- Test #: _______________
- Hata: _______________
- Çözüm: _______________

## Performans Metrikleri
- Ortalama response time: _______________
- Database query time: _______________
- Build time: _______________

## Öneriler
_______________

## Production'a Hazır mı?
- [ ] Evet, sorunsuz
- [ ] Hayır, şu düzeltmeler gerekli: _______________
```

---

## 🎯 Sonraki Adımlar

Staging testleri başarılı ise:

1. ✅ Test raporunu hazırla
2. ✅ Team review yap
3. ✅ Production deploy planı oluştur
4. ✅ Rollback stratejisini hazırla
5. ✅ Production'a deploy et
6. ⏳ 24 saat intensive monitoring
7. ⏳ Migrasyon 2'yi çalıştır (14 gün sonra)
8. ⏳ Final migration (28 gün sonra)

---

**Son Güncelleme:** 29 Aralık 2025
**Durum:** Hazır
**Tahmini Süre:** 2-3 gün
