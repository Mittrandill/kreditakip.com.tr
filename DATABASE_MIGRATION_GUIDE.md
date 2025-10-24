# Database Migration Kılavuzu

## 🎯 Yapılması Gerekenler

Normal payment API'ye geçtiğimiz için subscription tablosunda küçük bir değişiklik yapmanız gerekiyor.

## 📋 Adım Adım

### 1️⃣ Supabase SQL Editor'e Gidin

https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

### 2️⃣ Migration SQL'i Çalıştırın

`scripts/39-rename-started-at-column.sql` dosyasındaki kodu kopyalayıp çalıştırın:

\`\`\`sql
BEGIN;

ALTER TABLE public.subscriptions
RENAME COLUMN started_at TO start_date;

COMMENT ON COLUMN public.subscriptions.start_date
IS 'Subscription başlangıç tarihi';

COMMENT ON COLUMN public.subscriptions.iyzico_subscription_id
IS 'iyzico payment ID (normal payment API) veya subscription ID (subscription API)';

COMMIT;
\`\`\`

### 3️⃣ Test Edin

\`\`\`bash
# Development server'ı yeniden başlatın (gerekirse)
npm run dev

# Ödeme sayfasına gidin
http://localhost:3000/uygulama/odeme

# Test kartı ile ödeme yapın:
# Kart: 5528790000000008
# Tarih: 12/2030
# CVV: 123
\`\`\`

## ✅ Yapılan Değişiklikler

### Veritabanı

| Eski Alan | Yeni Alan | Açıklama |
|-----------|-----------|----------|
| `started_at` | `start_date` | Sadece isim değişti, veri aynı |
| `iyzico_subscription_id` | (aynı) | Artık normal payment ID için de kullanılıyor |

### Kod

| Dosya | Değişiklik |
|-------|-----------|
| `app/api/subscription/initialize/route.ts` | `start_date` kullanıyor, `iyzico_subscription_id` payment ID için |

## 🔍 Kontrol

Migration'dan sonra tablonuzu kontrol edin:

\`\`\`sql
-- Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Mevcut subscription'ları kontrol et
SELECT id, user_id, plan_type, status, start_date, expires_at, iyzico_subscription_id
FROM subscriptions
ORDER BY created_at DESC
LIMIT 5;
\`\`\`

Beklenen sonuç:
- ✅ `start_date` kolonu var
- ✅ `started_at` kolonu yok
- ✅ Mevcut veriler korunmuş

## 🚨 Sorun Giderme

### Migration Hatası: "column started_at does not exist"

Bu durumda migration zaten çalıştırılmış demektir. Sorun yok, devam edin.

### Migration Hatası: "permission denied"

Supabase Dashboard'dan SQL Editor kullanın, doğrudan database'e bağlanmayın.

### Ödeme Testi Başarısız

1. `.env.local` dosyanızı kontrol edin:
   \`\`\`env
   IYZICO_API_KEY=...
   IYZICO_SECRET_KEY=...
   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
   \`\`\`

2. Console logları kontrol edin:
   \`\`\`
   [iyzipay] Processing payment with normal payment API
   [iyzipay] Payment response: { status: 'success', ... }
   \`\`\`

3. Supabase'de subscription kaydını kontrol edin:
   \`\`\`sql
   SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
   \`\`\`

## 📝 Notlar

- Migration geri alınabilir (rollback SQL `SUBSCRIPTION_MIGRATION.md` dosyasında)
- Mevcut subscription kayıtları etkilenmez
- Production'a deploy etmeden önce test edin
- Migration sadece bir kez çalıştırılmalı

## 🎉 Tamamlandı!

Migration başarılı olduktan sonra:
- ✅ Normal payment API çalışıyor
- ✅ Subscription kayıtları oluşturuluyor
- ✅ 30 gün geçerli premium üyelik
- ✅ Usage limits otomatik güncelleniyor
