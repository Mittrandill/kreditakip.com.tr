# Next Billing Plan Migration - Uygulama Rehberi

## 🎯 Amaç

Kullanıcıların abonelik planlarını (aylık ↔ yıllık) geçişlerinde, değişikliğin **bir sonraki faturalama döneminde** geçerli olmasını sağlamak için `next_billing_plan` kolonu eklenir.

## 📋 Migration Detayları

**Dosya:** `supabase/migrations/20251123000007_add_next_billing_plan.sql`

**Değişiklikler:**
- ✅ `subscriptions` tablosuna `next_billing_plan` kolonu eklenir (TEXT)
- ✅ Kolon için yorum/açıklama eklenir
- ✅ Performans için index oluşturulur

## 🚀 Uygulama Adımları

### Adım 1: Supabase SQL Editor'ı Açın

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. Sol menüden **SQL Editor** tıklayın
3. **New Query** butonuna tıklayın

### Adım 2: Migration'ı Çalıştırın

Migration dosyasının içeriğini SQL Editor'a yapıştırın ve **Run** butonuna basın:

```sql
-- supabase/migrations/20251123000007_add_next_billing_plan.sql içeriğini yapıştırın
```

**Beklenen Çıktı:**
```
Success. No rows returned
```

### Adım 3: Doğrulama

Migration'ın başarılı olduğunu doğrulamak için:

```sql
-- Kolon eklenmiş mi kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'next_billing_plan';
```

**Beklenen Sonuç:**
```
column_name         | data_type | is_nullable
--------------------|-----------|-----------
next_billing_plan   | text      | YES
```

## 📊 Kullanım Senaryoları

### Senaryo 1: Aylık → Yıllık Geçiş

```typescript
// Kullanıcı yıllık plana geçmek istiyor
// API: /api/subscription/change-plan

{
  "newPlanId": "premium-yearly"
}

// Veritabanında:
UPDATE subscriptions
SET next_billing_plan = 'yearly'
WHERE user_id = 'xxx';

// Mevcut aylık abonelik devam eder
// expires_at tarihinde otomatik olarak yıllık plana geçilir
```

### Senaryo 2: Yıllık → Aylık Geçiş

```typescript
// Kullanıcı aylık plana geçmek istiyor

{
  "newPlanId": "premium-monthly"
}

// Veritabanında:
UPDATE subscriptions
SET next_billing_plan = 'monthly'
WHERE user_id = 'xxx';

// Mevcut yıllık abonelik expires_at'a kadar devam eder
// Sonra aylık plana düşer
```

### Senaryo 3: Plan Değişikliğini İptal Etme

```sql
-- Kullanıcı planlamayı iptal ederse
UPDATE subscriptions
SET next_billing_plan = NULL
WHERE user_id = 'xxx';
```

## 🔄 Backend İş Akışı

### Webhook/Cron Job (Önerilir)

Abonelik yenileme zamanı geldiğinde:

```typescript
// pseudocode
const subscription = await getSubscription(userId);

if (subscription.next_billing_plan) {
  // Plan değişikliği uygulanacak
  const newPlanId = `premium-${subscription.next_billing_plan}`;

  // 1. Yeni plan için ödeme işlemi
  const payment = await processPayment(newPlanId);

  if (payment.success) {
    // 2. Aboneliği güncelle
    await updateSubscription({
      plan_id: newPlanId,
      start_date: new Date(),
      expires_at: calculateExpiryDate(newPlanId),
      next_billing_plan: null, // Temizle
      status: 'active'
    });
  }
} else {
  // Normal yenileme
  await renewSubscription(subscription.plan_id);
}
```

## ⚠️ Önemli Notlar

### 1. Mevcut Abonelik Korunur

Plan değişikliği **anında** uygulanmaz. Kullanıcı mevcut aboneliğinden tam olarak yararlanır.

**Örnek:**
- 15 Kasım: Kullanıcı aylık premium alır (199₺)
- 20 Kasım: Yıllık plana geçmek ister
- **Değişiklik:** `next_billing_plan = 'yearly'` set edilir
- 15 Aralık: Mevcut aylık plan sona erer
- **15 Aralık'ta:** Otomatik olarak yıllık plan başlar (1,990₺ ödeme)

### 2. Webhook Gereksinimi

Bu özelliğin tam çalışması için:
- ✅ Ödeme gateway'inden webhook dinlenmeli
- ✅ Abonelik yenileme zamanı geldiğinde `next_billing_plan` kontrol edilmeli
- ✅ Eğer `next_billing_plan` varsa, yeni plan için ödeme alınmalı

### 3. UI'da Gösterim

Kullanıcıya şu bilgiler gösterilmeli:

```typescript
{
  currentPlan: "Aylık Premium - 199₺/ay",
  nextPlan: "Yıllık Premium - 1,990₺/yıl",
  effectiveDate: "15 Aralık 2025",
  message: "Mevcut planınız 15 Aralık 2025 tarihine kadar devam edecek. Ardından otomatik olarak yıllık plana geçeceksiniz."
}
```

## 🧪 Test Senaryoları

### Test 1: Kolon Ekleme

```sql
-- Migration çalıştırıldıktan sonra
SELECT * FROM subscriptions LIMIT 1;

-- next_billing_plan kolonu NULL olmalı (yeni eklendiği için)
```

### Test 2: Plan Değişikliği API

```bash
curl -X POST http://localhost:3000/api/subscription/change-plan \
  -H "Content-Type: application/json" \
  -d '{"newPlanId": "premium-yearly"}'
```

**Beklenen:** `200 OK` ve mesaj

### Test 3: Index Performansı

```sql
-- Index kullanılıyor mu?
EXPLAIN ANALYZE
SELECT * FROM subscriptions
WHERE next_billing_plan IS NOT NULL;

-- "Index Scan using idx_subscriptions_next_billing_plan" görülmeli
```

## 🔧 Sorun Giderme

### Hata: "column already exists"

```sql
-- Kolon zaten varsa, hata vermez (IF NOT EXISTS kullanıldı)
-- Ama güvenlik için kontrol:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions' AND column_name = 'next_billing_plan';
```

### API Hatası Devam Ediyorsa

1. **Cache temizleme:**
   - Supabase Dashboard → Settings → API → "Refresh schema cache"
   - Veya 5-10 dakika bekleyin (otomatik yenilenir)

2. **Restart dev server:**
   ```bash
   # Dev server'ı durdur
   pnpm dev
   ```

## 📈 İyileştirme Önerileri

### Gelecekte Eklenebilecek Özellikler:

1. **Plan geçiş geçmişi:**
   ```sql
   CREATE TABLE subscription_plan_changes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     from_plan TEXT,
     to_plan TEXT,
     scheduled_at TIMESTAMP,
     applied_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **E-posta bildirimi:**
   - Plan değişikliği planlandığında
   - 3 gün önce hatırlatma
   - Değişiklik gerçekleştiğinde onay

3. **Proration (orantılama):**
   - Kullanılmayan günler için iade
   - Yeni plan için ek ücret

## ✅ Checklist

- [ ] Migration dosyası Supabase SQL Editor'da çalıştırıldı
- [ ] Kolon başarıyla eklendi (doğrulama sorgusu çalıştı)
- [ ] Index oluşturuldu
- [ ] API endpoint test edildi
- [ ] Dev server yeniden başlatıldı
- [ ] UI'da plan değiştirme testi yapıldı
- [ ] Webhook/cron job plan değişikliğini uygulayacak şekilde ayarlandı

---

**Son Güncelleme:** 2025-11-23
**Migration Dosyası:** `20251123000007_add_next_billing_plan.sql`
**API Endpoint:** `/api/subscription/change-plan`
