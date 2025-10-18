# Subscription Tablosu Migration - Normal Payment API

## Durum Analizi

### Mevcut Tablo Yapısı
- `started_at` - Başlangıç tarihi
- `iyzico_subscription_id` - Subscription API için (artık kullanılmıyor)
- `iyzico_subscription_reference` - Subscription API için (artık kullanılmıyor)

### Kod ile Uyumsuzluklar
- ❌ Kod `start_date` kullanıyor, tablo `started_at` içeriyor
- ❌ Kod `iyzico_payment_id` kullanıyor, tabloda yok

## Seçenek 1: Kodu Güncelle (ÖNERİLEN - HIZLI)

Tabloyu değiştirmek yerine kodu tabloya uyumlu hale getirin. Bu daha hızlı ve güvenli.

### `app/api/subscription/initialize/route.ts` Değişiklikleri

```typescript
// ÖNCEKİ:
const { error: updateError } = await supabase.from("subscriptions").upsert({
  user_id: userId,
  plan_type: "premium",
  status: "active",
  start_date: startDate.toISOString(),  // ❌ HATALI
  expires_at: expiresAt.toISOString(),
  payment_method: "iyzico",
  iyzico_payment_id: paymentId,  // ❌ Tablo'da yok
  updated_at: new Date().toISOString(),
})

// YENİ:
const { error: updateError } = await supabase.from("subscriptions").upsert({
  user_id: userId,
  plan_type: "premium",
  status: "active",
  started_at: startDate.toISOString(),  // ✅ DOĞRU
  expires_at: expiresAt.toISOString(),
  payment_method: "iyzico",
  iyzico_subscription_id: paymentId,  // ✅ Mevcut alanı kullan
  updated_at: new Date().toISOString(),
})
```

**Not**: `iyzico_subscription_id` alanını normal payment ID için kullanıyoruz (semantic olarak hatalı ama çalışır).

---

## Seçenek 2: Tabloyu Güncelle (DETAYLI)

Tabloyu koda uyumlu hale getirin. Bu daha semantik doğru ama migration gerektirir.

### Migration SQL

```sql
-- =====================================================
-- Migration: 39-update-subscriptions-for-normal-payment
-- Date: 2025-01-18
-- Description: Normal payment API için subscription tablosu güncellemeleri
-- =====================================================

BEGIN;

-- 1. started_at -> start_date rename (isteğe bağlı, semantik)
-- NOT: Bu değişiklik mevcut verileri etkilemez
ALTER TABLE public.subscriptions
RENAME COLUMN started_at TO start_date;

-- 2. iyzico_payment_id alanı ekle (normal payment için)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS iyzico_payment_id TEXT;

-- 3. Index ekle (payment ID için hızlı arama)
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id
ON public.subscriptions(iyzico_payment_id);

-- 4. Eski subscription alanlarını nullable yap (zaten nullable ama emin olmak için)
-- iyzico_subscription_id ve iyzico_subscription_reference artık opsiyonel
COMMENT ON COLUMN public.subscriptions.iyzico_subscription_id
IS 'Deprecated: Subscription API için kullanılıyordu (artık null olabilir)';

COMMENT ON COLUMN public.subscriptions.iyzico_subscription_reference
IS 'Deprecated: Subscription API için kullanılıyordu (artık null olabilir)';

-- 5. Yeni alan için comment
COMMENT ON COLUMN public.subscriptions.iyzico_payment_id
IS 'Normal payment API payment ID (tek seferlik ödeme için)';

COMMIT;
```

### Rollback SQL (Geri Alma)

```sql
-- =====================================================
-- Rollback: 39-update-subscriptions-for-normal-payment
-- =====================================================

BEGIN;

-- Index'i kaldır
DROP INDEX IF EXISTS idx_subscriptions_payment_id;

-- Yeni alanı kaldır
ALTER TABLE public.subscriptions
DROP COLUMN IF EXISTS iyzico_payment_id;

-- Rename'i geri al
ALTER TABLE public.subscriptions
RENAME COLUMN start_date TO started_at;

COMMIT;
```

---

## Seçenek 3: Hibrit Yaklaşım (ÖNERİLEN)

Mevcut `iyzico_subscription_id` alanını kullanmaya devam edin ama `start_date` için sadece kodda düzeltme yapın.

### Minimal Migration SQL

```sql
-- =====================================================
-- Migration: 39-rename-started-at-column
-- Date: 2025-01-18
-- Description: started_at -> start_date (kod uyumluluğu)
-- =====================================================

BEGIN;

-- Sadece rename yap
ALTER TABLE public.subscriptions
RENAME COLUMN started_at TO start_date;

-- Comment güncelle
COMMENT ON COLUMN public.subscriptions.start_date
IS 'Subscription başlangıç tarihi';

COMMIT;
```

### Kod Güncellemesi

```typescript
// app/api/subscription/initialize/route.ts içinde
const { error: updateError } = await supabase.from("subscriptions").upsert({
  user_id: userId,
  plan_type: "premium",
  status: "active",
  start_date: startDate.toISOString(),  // ✅ Artık uyumlu
  expires_at: expiresAt.toISOString(),
  payment_method: "iyzico",
  iyzico_subscription_id: paymentId,  // ✅ Mevcut alanı kullan
  updated_at: new Date().toISOString(),
})
```

---

## Öneri

**Seçenek 3 (Hibrit)** kullanın:

1. ✅ Minimal migration (sadece rename)
2. ✅ Mevcut alanları kullanır (`iyzico_subscription_id` payment ID için)
3. ✅ Kod daha okunaklı (`start_date`)
4. ✅ Geriye dönük uyumlu

## Uygulama Adımları

### 1. Migration Çalıştır

```bash
# Supabase SQL Editor'e gidin
# Migration SQL'i yapıştırıp çalıştırın
```

### 2. Kodu Güncelle

`app/api/subscription/initialize/route.ts` dosyasında:

```typescript
// Değiştir:
start_date: startDate.toISOString(),

// Ve
iyzico_subscription_id: paymentId,  // NOT: payment_id yerine subscription_id kullan
```

### 3. Test Et

```bash
npm run dev
# Ödeme formunu test edin
```

---

## Alan Kullanım Tablosu

| Alan Adı | Subscription API | Normal Payment API | Durum |
|----------|-----------------|-------------------|-------|
| `start_date` (eski: `started_at`) | ✅ Kullanılır | ✅ Kullanılır | ✅ Aktif |
| `expires_at` | ✅ Kullanılır | ✅ Kullanılır | ✅ Aktif |
| `iyzico_subscription_id` | ✅ Subscription ID | ✅ Payment ID | ✅ Aktif (yeniden kullanılıyor) |
| `iyzico_subscription_reference` | ✅ Reference Code | ❌ Kullanılmaz | ⚠️ Nullable (eski) |
| `iyzico_payment_id` (yeni) | ❌ Kullanılmaz | ✅ Payment ID | 💡 Opsiyonel (Seçenek 2) |
| `payment_method` | ✅ "iyzico" | ✅ "iyzico" | ✅ Aktif |

---

## Özet

**En Hızlı**: Seçenek 1 (sadece kod güncelle, migration yok)
**En Temiz**: Seçenek 2 (yeni alan ekle, migration var)
**En Pratik**: Seçenek 3 (minimal migration + kod güncelle) ← **ÖNERİLEN**
