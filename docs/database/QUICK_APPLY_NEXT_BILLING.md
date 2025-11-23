# Hızlı Uygulama: next_billing_plan Migration

## ⚡ 2 Dakikada Uygula

### Adım 1: SQL Dosyasını Kopyala

`supabase/migrations/20251123000007_add_next_billing_plan.sql` dosyasının tüm içeriğini kopyala.

### Adım 2: Supabase Dashboard'a Git

1. https://supabase.com/dashboard
2. Projeyi seç
3. Sol menüden **SQL Editor** → **New Query**

### Adım 3: Yapıştır ve Çalıştır

SQL'i yapıştır ve **RUN** butonuna bas.

**Beklenen:** ✅ "Success. No rows returned"

### Adım 4: Doğrula

Aynı SQL Editor'da çalıştır:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'next_billing_plan';
```

**Beklenen:** 1 satır dönmeli (kolon eklenmiş)

### Adım 5: Cache Yenile (İsteğe Bağlı)

Eğer API hala hata veriyorsa:

1. Supabase Dashboard → **Settings** → **API**
2. **"Refresh schema cache"** butonuna bas
3. Veya 5 dakika bekle

---

## ✅ Tamamlandı!

Artık `/api/subscription/change-plan` endpoint'i çalışacak.

Plan değiştirme testi için:

```bash
curl -X POST http://localhost:3000/api/subscription/change-plan \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"newPlanId": "premium-yearly"}'
```

---

**Detaylı bilgi için:** `NEXT_BILLING_PLAN_MIGRATION.md`
