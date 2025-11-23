# Veritabanı İyileştirmeleri Uygulama Rehberi

**Proje:** kreditakip.com.tr
**Tarih:** 2025-11-23

---

## 📋 Genel Bakış

Bu rehber, tespit edilen veritabanı sorunlarının çözümü için hazırlanan migration dosyalarının uygulanması sürecini açıklamaktadır.

### Hazırlanan Migration Dosyaları

1. `20251123000001_critical_indexes.sql` - Kritik performans indexleri
2. `20251123000002_rls_policies.sql` - Row Level Security politikaları
3. `20251123000003_data_integrity.sql` - Veri bütünlüğü iyileştirmeleri
4. `20251123000004_helper_functions.sql` - Yardımcı fonksiyonlar

---

## ⚠️ UYGULAMA ÖNCESİ UYARILAR

### 1. Yedekleme (KRİTİK!)

```bash
# Supabase dashboard'dan full backup alın
# Veya pg_dump kullanın
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Ortamı

**ÖNCE TEST ORTAMINDA UYGULA!**
- Production'da test etmeyin
- Staging/development ortamında tüm migrationları test edin
- Uygulama kodunun yeni yapıyla uyumlu olduğundan emin olun

### 3. Bakım Modu

Production'a uygularken:
- Bakım modunu aktive edin
- Kullanıcılara bilgi verin
- Düşük trafik saatlerinde uygulayın (gece 02:00-04:00 arası önerilir)

---

## 🚀 UYGULAMA ADIMLARI

### Faz 1: Indexler (Downtime: ~5-10 dakika)

**Risk Seviyesi:** Düşük
**Geri Dönüş:** Kolay
**Tahmini Süre:** 5-10 dakika

```bash
# 1. Migration dosyasını inceleyin
cat supabase/migrations/20251123000001_critical_indexes.sql

# 2. Supabase Dashboard > SQL Editor'da çalıştırın
# VEYA
# 3. Supabase CLI ile
supabase db push

# 4. Verify indexes
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Beklenen Sonuç:**
- ~50+ yeni index oluşturulmalı
- Query süreleri 10x hızlanmalı
- Herhangi bir data değişikliği YOK

**Sorun Çıkarsa:**
```sql
-- İndexleri geri al
DROP INDEX IF EXISTS idx_credits_user_id_created_at;
-- ... (tüm indexler için tekrarla)
```

---

### Faz 2: RLS Politikaları (Downtime: 10-15 dakika) **KRİTİK!**

**Risk Seviyesi:** YÜKSEK
**Geri Dönüş:** Orta
**Tahmini Süre:** 10-15 dakika

**⚠️ ÖNEMLİ:** Bu migration, mevcut client kodunuzu etkileyebilir!

#### Ön Hazırlık

1. **Service Role Key Kullanımını Kontrol Edin:**

```typescript
// ✅ İYİ: Server-side (API routes, cron jobs)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!, // RLS bypass
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

// ❌ KÖTÜ: Client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // RLS applies
)
```

2. **Admin İşlemleri İçin Service Role Kullanın:**

Şu dosyalarda SERVICE_ROLE_KEY kullanımını kontrol edin:
- `app/api/risk-analysis/route.ts` ✅ (Zaten kullanıyor)
- `app/api/notifications/send-reminders/route.tsx`
- `app/api/cron/subscription-renewal/route.ts`

#### Uygulama

```sql
-- 1. ÖNCE TEK BİR TABLODA TEST EDİN
-- Test için profiles tablosunu kullan

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Test edin
-- Client'tan login olun ve profil görüntülemeyi test edin

-- 3. SORUN YOKSA DEVAM EDİN
-- Tüm migration dosyasını çalıştırın
```

**Test Checklist:**
- [ ] Kullanıcı kendi kredilerini görebiliyor mu?
- [ ] Kullanıcı başkasının kredilerini GÖREMİYOR mu?
- [ ] Admin kullanıcı tüm verileri görebiliyor mu?
- [ ] API routes hala çalışıyor mu?
- [ ] Cron jobs hata vermiyor mu?

**Sorun Çıkarsa:**
```sql
-- RLS'yi devre dışı bırak
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;

-- Politikaları sil
DROP POLICY "policy_name" ON tablename;
```

---

### Faz 3: Veri Bütünlüğü (Downtime: 15-20 dakika)

**Risk Seviyesi:** Orta
**Geri Dönüş:** Zor (data validation gerekebilir)
**Tahmini Süre:** 15-20 dakika

#### Ön Hazırlık: Veri Doğrulama

```sql
-- ÖNCE MOVCİT VERİYİ KONTROL EDİN
-- Geçersiz veri varsa FIX edin

-- 1. Invalid credits check
SELECT
  id,
  credit_code,
  initial_amount,
  remaining_debt,
  monthly_payment,
  interest_rate
FROM credits
WHERE initial_amount <= 0
   OR remaining_debt < 0
   OR monthly_payment <= 0
   OR interest_rate < 0
   OR interest_rate > 100
   OR total_installments <= 0
   OR remaining_installments < 0
   OR remaining_installments > total_installments
   OR payment_progress < 0
   OR payment_progress > 100
   OR end_date <= start_date;

-- Eğer invalid data varsa, FIX:
UPDATE credits
SET remaining_debt = 0
WHERE remaining_debt < 0;

-- 2. Invalid payment plans check
SELECT
  id,
  credit_id,
  installment_number,
  principal_amount,
  interest_amount,
  total_payment
FROM payment_plans
WHERE principal_amount < 0
   OR interest_amount < 0
   OR total_payment <= 0
   OR remaining_debt < 0
   OR installment_number <= 0
   OR abs(total_payment - (principal_amount + interest_amount)) >= 0.01;
```

#### Uygulama

```bash
# Veri geçerliyse, migration'ı uygula
supabase db push
```

**Önemli:** Bu migration şunları ekler:
- CHECK constraints (invalid data reject edilir)
- CASCADE delete rules (ilişkili veriler otomatik silinir)
- Automatic triggers (updated_at otomatik güncellenir)
- Soft delete columns (deleted_at)

**Test Checklist:**
- [ ] Yeni credit ekleyebildiniz mi?
- [ ] Negatif değerlerle credit eklemeyi deneyin (REJECT edilmeli)
- [ ] Payment plan create/update çalışıyor mu?
- [ ] Credit sildiğinizde payment_plans da siliniyor mu?
- [ ] updated_at otomatik güncelleniyomu?

---

### Faz 4: Helper Functions (Downtime: 5 dakika)

**Risk Seviyesi:** Düşük
**Geri Dönüş:** Kolay
**Tahmini Süre:** 5 dakika

```bash
supabase db push
```

**Test:**
```sql
-- Dashboard summary test
SELECT get_user_dashboard_summary('your-user-uuid');

-- Credit details test
SELECT get_credit_details('credit-uuid', 'user-uuid');

-- Upcoming payments test
SELECT * FROM get_upcoming_payments('user-uuid', 30);
```

---

## 📊 POST-MIGRATION CHECKLIST

### 1. Performans Testi

```sql
-- EXPLAIN ANALYZE ile query planlarını kontrol et

-- Örnek: Credits listesi
EXPLAIN ANALYZE
SELECT * FROM credits
WHERE user_id = 'uuid'
ORDER BY created_at DESC;

-- Index Scan görmelisiniz (Seq Scan DEĞİL)
```

### 2. Monitoring Kurulumu

```sql
-- Slow query log
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- 1 saniyeden uzun queryler

-- Query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- En yavaş queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 3. Index Kullanım İstatistikleri

```sql
-- Kullanılmayan indexler (1 hafta sonra kontrol edin)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

---

## 🔄 APPLICATION CODE UPDATES

### 1. RLS Sonrası Gerekli Değişiklikler

#### a) Server-Side Admin Queries

```typescript
// ÖNCE (RLS yok, herhangi bir client çalışırdı)
const { data } = await supabase
  .from('credits')
  .select('*')

// SONRA (RLS var, service role gerekli)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const { data } = await supabaseAdmin
  .from('credits')
  .select('*')
```

#### b) Cron Jobs

```typescript
// app/api/cron/subscription-renewal/route.ts
// app/api/notifications/send-reminders/route.tsx

// Service role kullandığından emin olun
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!, // ✅
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### 2. Helper Functions Kullanımı

#### Önce (N+1 Query)

```typescript
// ❌ 3 ayrı query
const { data: credits } = await supabase
  .from('credits')
  .select('*')
  .eq('user_id', userId)

const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)

const { data: upcomingPayments } = await supabase
  .from('payment_plans')
  .select('*')
  .eq('status', 'pending')
// ... filter credits
```

#### Sonra (Single Query)

```typescript
// ✅ Tek query, tüm data
const { data } = await supabase
  .rpc('get_user_dashboard_summary', { p_user_id: userId })

// Response:
// {
//   total_credits: 5,
//   active_credits: 3,
//   total_debt: 150000,
//   monthly_payment: 5000,
//   upcoming_payments_7_days: 2,
//   unread_notifications: 3
// }
```

### 3. Updated_at Manuel Güncellemelerini Kaldırın

```typescript
// ❌ ÖNCE
await supabase
  .from('credits')
  .update({
    remaining_debt: newDebt,
    updated_at: new Date().toISOString() // ARTIK GEREKSİZ
  })

// ✅ SONRA (trigger otomatik halleder)
await supabase
  .from('credits')
  .update({
    remaining_debt: newDebt
    // updated_at REMOVED
  })
```

### 4. Credit Status Update Otomasyonu

```typescript
// ❌ ÖNCE (lib/api/credits.ts:154-192)
export async function updateCreditStatus(creditId: string) {
  const { data: paymentPlans } = await supabase
    .from("payment_plans")
    .select("*")
    .eq("credit_id", creditId)

  // Manuel calculation...
  const remainingDebt = pendingPlans.reduce(...)

  await supabase
    .from("credits")
    .update({ remaining_debt, ... })
}

// ✅ SONRA (trigger otomatik yapar)
// updateCreditStatus() fonksiyonunu KALDIRABİLİRSİNİZ
// Payment plan update edildiğinde credit otomatik güncellenir
```

---

## 🛠️ TROUBLESHOOTING

### Problem 1: "permission denied for table X"

**Sebep:** RLS politikaları çok sıkı

**Çözüm:**
```sql
-- Politikayı kontrol et
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Gerekirse service role kullan
```

### Problem 2: "new row violates check constraint"

**Sebep:** Invalid data insert edilmeye çalışılıyor

**Çözüm:**
```typescript
// Validation ekle
if (amount <= 0) {
  throw new Error('Amount must be positive')
}
```

### Problem 3: Slow queries hala var

**Çözüm:**
```sql
-- Index kullanımını kontrol et
EXPLAIN ANALYZE SELECT ...

-- Eğer Seq Scan görüyorsanız, index eksik
CREATE INDEX idx_missing ON table(column);
```

### Problem 4: "function does not exist"

**Sebep:** Helper functions migration uygulanmamış

**Çözüm:**
```bash
supabase db push
```

---

## 📈 EXPECTED IMPROVEMENTS

### Performans

| Query | Önce | Sonra | İyileşme |
|-------|------|-------|----------|
| Credits List | ~500ms | ~50ms | **10x** |
| Notifications | ~300ms | ~30ms | **10x** |
| Dashboard Summary | ~2000ms | ~200ms | **10x** |
| Risk Analysis | ~3000ms | ~800ms | **3.75x** |
| Payment Plans | ~400ms | ~40ms | **10x** |

### Güvenlik

- ✅ RLS aktif → Kullanıcılar sadece kendi verilerini görebilir
- ✅ Sensitive data korumalı (banking_credentials, saved_cards)
- ✅ Admin kontrolü aktif

### Veri Kalitesi

- ✅ Invalid data prevent edilir
- ✅ Orphan records oluşmaz
- ✅ Automatic triggers → manuel hatalar azalır

---

## 🔐 SECURITY NOTES

### Service Role Key Güvenliği

**ASLA:**
- ❌ Client-side kodda kullanmayın
- ❌ Git'e commit etmeyin
- ❌ Public API'lerde expose etmeyin

**SADECE:**
- ✅ Server-side API routes
- ✅ Cron jobs
- ✅ Background workers
- ✅ .env.local (gitignore)

### RLS Bypass

```typescript
// RLS bypass eder (SERVICE_ROLE_KEY)
const adminClient = createClient(url, SERVICE_ROLE_KEY)

// RLS uygular (ANON_KEY)
const userClient = createClient(url, ANON_KEY)
```

---

## 📞 İLETİŞİM ve DESTEK

**Sorun yaşarsanız:**
1. Bu dokümanı tekrar okuyun
2. Migration dosyalarındaki ROLLBACK bölümünü kontrol edin
3. Backup'tan restore edin
4. Development ortamında tekrar test edin

**Başarılı deployment sonrası:**
1. Monitoring kurun
2. 1 hafta boyunca performansı izleyin
3. Unused indexleri temizleyin
4. Query performansını ölçün

---

## ✅ FINAL CHECKLIST

Deployment'tan önce:
- [ ] Backup alındı
- [ ] Test ortamında test edildi
- [ ] Tüm testler geçti
- [ ] Service role key güvenli
- [ ] Monitoring hazır
- [ ] Rollback planı hazır
- [ ] Bakım modu ayarlandı
- [ ] Takım bilgilendirildi

Deployment sonrası:
- [ ] Tüm migrations uygulandı
- [ ] Indexler oluşturuldu
- [ ] RLS politikaları aktif
- [ ] Helper functions çalışıyor
- [ ] Performans iyileşti
- [ ] Herhangi bir error yok
- [ ] Kullanıcılar erişebiliyor
- [ ] Monitoring aktif

---

**Son Güncelleme:** 2025-11-23
**Hazırlayan:** Database Performance & Security Review Team
