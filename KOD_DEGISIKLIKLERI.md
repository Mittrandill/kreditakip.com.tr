# Kod Değişiklikleri - usage_tracking → subscription_usage Geçişi

Bu doküman, `usage_tracking` tablosundan `subscription_usage` tablosuna geçiş için yapılan tüm kod değişikliklerini listeler.

## ✅ Tamamlanan Değişiklikler

### 1. `app/api/cron/subscription-expiry-check/route.ts`

**Değişiklik:** `usage_tracking` → `subscription_usage`

**Satırlar:** 105-131

**Değişen Kolonlar:**
- `used_count` → `usage_count`
- Eklenen: `subscription_id`, `saved_credits_count`, `saved_credits_limit`

**Detaylar:**
```typescript
// ESKİ
.from("usage_tracking").upsert([
  {
    user_id: subscription.user_id,
    feature_type: "ocr_analysis",
    limit_count: -1,
    used_count: 0,  // ESKİ
    reset_at: null,
    updated_at: now.toISOString(),
  }
])

// YENİ
.from("subscription_usage").upsert([
  {
    user_id: subscription.user_id,
    subscription_id: subscription.id,  // EKLENEN
    feature_type: "ocr_analysis",
    limit_count: -1,
    usage_count: 0,  // DEĞİŞTİ
    saved_credits_count: 0,  // EKLENEN
    saved_credits_limit: 1,  // EKLENEN
    reset_at: null,
    updated_at: now.toISOString(),
  }
])
```

---

### 2. `app/api/cron/grace-period-handler/route.ts`

**Değişiklik:** `usage_tracking` → `subscription_usage`

**Satırlar:** 173-182

**Değişen Kolonlar:**
- `used_count` eklenmedi ama `usage_count` resetlendi

**Detaylar:**
```typescript
// ESKİ
.from("usage_tracking")
.update({
  limit_count: 0,
  updated_at: now.toISOString(),
})

// YENİ
.from("subscription_usage")
.update({
  limit_count: 0,
  usage_count: 0,  // EKLENEN - kullanımı da resetle
  updated_at: now.toISOString(),
})
```

---

### 3. `app/api/cron/webhook-cleanup/route.ts` (YENİ DOSYA)

**Durum:** ✅ Yeni dosya oluşturuldu

**Amaç:** PayTR ve Paddle webhook'larını otomatik temizlemek

**Özellikler:**
- 90 günden eski işlenmiş webhook'ları siler
- Her hafta pazar günü saat 04:00'te çalışır
- cleanup_jobs tablosunda takip edilir
- Hem GET hem POST destekler

---

### 4. `vercel.json`

**Değişiklik:** Webhook cleanup cron job'ı eklendi

**Değişiklikler:**
```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-expiry-check",
      "schedule": "0 2 * * *"  // Her gün 02:00
    },
    {
      "path": "/api/cron/grace-period-handler",
      "schedule": "0 3 * * *"  // Her gün 03:00
    },
    {
      "path": "/api/cron/renewal-notification",
      "schedule": "0 9 * * *"  // Her gün 09:00
    },
    {
      "path": "/api/cron/webhook-cleanup",
      "schedule": "0 4 * * 0"  // Her pazar 04:00 (YENİ)
    }
  ]
}
```

---

## ✅ Son Güncellenen Dosyalar (29 Aralık 2025)

### 5. `app/admin/page.tsx` - GÜNCELLENDİ ✓

**Değişiklik:** Lines 67-81

**Değişen Sorgular:**
```typescript
// ESKİ
const { data: usageStats } = await supabase
  .from("usage_tracking")
  .select("feature_type, used_count, saved_credits_count")

// YENİ
const { data: usageStats } = await supabase
  .from("subscription_usage")
  .select("feature_type, usage_count, saved_credits_count")
```

**Değişen Kolonlar:**
- `used_count` → `usage_count` (tüm reduce fonksiyonlarında)

---

### 6. `app/uygulama/ayarlar/page.tsx` - GÜNCELLENDİ ✓

**Değişiklik:** Lines 537-554, 557-573

**Değişen Sorgular:**
```typescript
// ESKİ
const [
  ...
  { data: usageTracking },
] = await Promise.all([
  ...
  supabase.from("usage_tracking").select("*").eq("user_id", user.id),
])

// YENİ
const [
  ...
  { data: subscriptionUsage },
] = await Promise.all([
  ...
  supabase.from("subscription_usage").select("*").eq("user_id", user.id),
])
```

**Export Data Yapısı:**
- `usageTracking` → `subscriptionUsage`

---

### 7. `app/api/user/export-data/route.ts` - GÜNCELLENDİ ✓

**Değişiklik:** Lines 23-33, 63-75

**Değişen Sorgular:**
```typescript
// ESKİ
await Promise.all([
  ...
  supabase.from("usage_tracking").select("*").eq("user_id", user.id),
])

// YENİ
await Promise.all([
  ...
  supabase.from("subscription_usage").select("*").eq("user_id", user.id),
])
```

**KVKK Export Formatı:**
- `usageData.tracking` → `usageData.subscriptionUsage`
- `metadata.totalRecords.usageTracking` → `metadata.totalRecords.subscriptionUsage`

---

## 📋 Kontrol Listesi

### Kod Değişiklikleri
- [x] subscription-expiry-check/route.ts
- [x] grace-period-handler/route.ts
- [x] webhook-cleanup/route.ts (yeni)
- [x] vercel.json
- [x] admin/page.tsx ✅ TAMAMLANDI (29 Aralık)
- [x] ayarlar/page.tsx ✅ TAMAMLANDI (29 Aralık)
- [x] export-data/route.ts ✅ TAMAMLANDI (29 Aralık)

### Test Edilecekler
- [ ] Subscription expiry cron job test
- [ ] Grace period handler cron job test
- [ ] Webhook cleanup cron job test (manuel)
- [ ] Kullanıcı ayarları sayfası
- [ ] Admin paneli istatistikleri

### Migrasyon Sırası
1. [ ] Kalan kod değişikliklerini tamamla
2. [ ] Staging'de test et
3. [ ] Production'a dağıt
4. [ ] 24 saat bekle ve logları izle
5. [ ] Migrasyon 2'yi çalıştır (usage_tracking'i deprecated yap)
6. [ ] 14 gün gözlemle
7. [ ] Migrasyon 4'ü çalıştır (tabloyu sil)

---

## 🔍 Doğrulama Sorguları

Dağıtımdan sonra çalıştırın:

### 1. usage_tracking'e yazma olup olmadığını kontrol et

```sql
SELECT
  COUNT(*) as recent_writes,
  MAX(updated_at) as last_write,
  MAX(updated_at) > NOW() - INTERVAL '1 hour' as has_recent_write
FROM usage_tracking
WHERE updated_at > NOW() - INTERVAL '24 hours';
```

**Beklenen:** 0 yazma

### 2. subscription_usage'ın doğru çalışıp çalışmadığını kontrol et

```sql
SELECT
  COUNT(DISTINCT user_id) as user_count,
  COUNT(*) as total_records,
  feature_type,
  AVG(usage_count) as avg_usage,
  AVG(limit_count) as avg_limit
FROM subscription_usage
GROUP BY feature_type;
```

**Beklenen:** Her kullanıcı için 2 kayıt (ocr_analysis + risk_analysis)

### 3. Cron job'ların çalışıp çalışmadığını kontrol et

```sql
SELECT
  job_name,
  last_run_at,
  status,
  records_deleted,
  error_message
FROM cleanup_jobs
ORDER BY last_run_at DESC;
```

**Beklenen:** webhook_cleanup job'larının çalıştığını göreceksiniz

---

## 📝 Notlar

1. **Geri Dönüş Planı:** Eğer sorun çıkarsa `_deprecated_usage_tracking_20251229` geri yüklenebilir
2. **Veri Kaybı Riski:** YOK - Tüm veri usage_tracking_final_backup'ta
3. **Downtime:** YOK - Değişiklikler hot-deploy ile yapılabilir
4. **Monitoring:** İlk 48 saat yoğun log izleme önerilir

---

**Son Güncelleme:** 29 Aralık 2025
**Durum:** ✅ Kod değişiklikleri %100 tamamlandı
**Sonraki Adım:** Staging ortamında test et
