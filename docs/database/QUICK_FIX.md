# Hızlı Düzeltme Rehberi - Data Integrity Hatası

## ❌ Aldığınız Hata

```
ERROR: 23514: check constraint "payment_plans_valid_total"
of relation "payment_plans" is violated by some row
```

## ✅ Çözüm

### Adım 1: Mevcut Veriyi Düzelt

Önce bu migration'ı çalıştırın (constraint eklemeden önce veriyi düzeltir):

```sql
-- Supabase SQL Editor'da çalıştırın
-- Dosya: supabase/migrations/20251123000002_fix_existing_data.sql
```

Bu migration:
- ✅ `payment_plans` tablosunda `total_payment` değerlerini düzeltir
- ✅ Negatif değerleri 0 yapar
- ✅ Tutarsız hesaplamaları düzeltir
- ✅ Detaylı rapor verir

### Adım 2: Doğrulama

Migration sonunda şu gibi bir çıktı göreceksiniz:

```
NOTICE: Found 15 payment plans with invalid totals
NOTICE: ==============================================
NOTICE: DATA FIX VERIFICATION REPORT
NOTICE: ==============================================
NOTICE: Invalid credits remaining: 0
NOTICE: Invalid payment plans remaining: 0
NOTICE: Invalid payment history remaining: 0
NOTICE: ==============================================
NOTICE: ✅ All data is now valid and ready for constraints!
```

### Adım 3: Constraint'leri Ekle

Eğer yukarıdaki rapor **0** gösteriyorsa, şimdi data integrity migration'ını çalıştırabilirsiniz:

```sql
-- Dosya: supabase/migrations/20251123000004_data_integrity.sql
```

---

## 🔍 Hala Hata Alıyorsanız

### Manuel Kontrol

```sql
-- Hangi satırlar problematik?
SELECT
  id,
  credit_id,
  installment_number,
  principal_amount,
  interest_amount,
  total_payment,
  (principal_amount + interest_amount) as calculated_total,
  abs(total_payment - (principal_amount + interest_amount)) as difference
FROM payment_plans
WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01
ORDER BY difference DESC
LIMIT 20;
```

### Manuel Düzeltme

```sql
-- Eğer hala problemli satırlar varsa, manuel düzelt:
UPDATE payment_plans
SET total_payment = principal_amount + interest_amount
WHERE abs(total_payment - (principal_amount + interest_amount)) >= 0.01;
```

---

## 📋 Doğru Migration Sırası

1. ✅ **20251123000001_critical_indexes.sql** (zaten çalıştırılabilir)
2. ✅ **20251123000002_fix_existing_data.sql** (ŞİMDİ ÇALIŞTIR)
3. ⏳ **20251123000003_rls_policies.sql** (veri düzeltildikten sonra)
4. ⏳ **20251123000004_data_integrity.sql** (veri düzeltildikten sonra)
5. ⏳ **20251123000005_helper_functions.sql** (en son)

---

## 🚀 Hızlı Çözüm Komutu

Supabase Dashboard > SQL Editor'da:

```sql
-- 1. Veriyi düzelt
\i supabase/migrations/20251123000002_fix_existing_data.sql

-- 2. Raporu kontrol et, 0 ise devam:

-- 3. Constraint'leri ekle
\i supabase/migrations/20251123000004_data_integrity.sql
```

---

## ⚠️ Not

Bu sorun NORMAL'dir çünkü:
- Mevcut uygulamada validation yok
- Bazı payment plan'lar yuvarlama hataları içerebilir
- Manuel güncellemeler tutarsızlık yaratmış olabilir

Fix migration'ı bu sorunları otomatik çözer! 🎉
