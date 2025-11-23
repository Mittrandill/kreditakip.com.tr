# Supabase Linter Güvenlik Uyarıları - Çözüm Rehberi

## 🔴 Tespit Edilen Güvenlik Uyarıları

### 1. Function Search Path Mutable (14 adet) - ✅ FIXED

**Sorun:** Function'lar `search_path` belirtmediğinde, search_path injection saldırısına açık olur.

**Risk:** Kötü niyetli kullanıcı, search_path'i değiştirerek farklı function'ları çağırabilir veya beklenmeyen davranışlara sebep olabilir.

**Çözüm:** ✅ `20251123000006_security_fixes.sql` migration'ı

Tüm function'lara `SET search_path = public, pg_temp` eklendi:
- ✅ `is_admin()`
- ✅ `update_updated_at_column()`
- ✅ `calculate_credit_status()`
- ✅ `update_credit_after_payment_change()`
- ✅ `get_user_dashboard_summary()`
- ✅ `get_credit_details()`
- ✅ `get_upcoming_payments()`
- ✅ `get_bank_debt_breakdown()`
- ✅ `calculate_financial_health_metrics()`
- ✅ `can_use_feature()`
- ✅ `increment_usage()`
- ✅ `create_payment_reminders_batch()`
- ✅ `cleanup_old_notifications()`
- ✅ `cleanup_expired_pending_subscriptions()`

---

### 2. Leaked Password Protection Disabled - ⚠️ MANUEL AYAR GEREKLİ

**Sorun:** Supabase Auth'un "Leaked Password Protection" özelliği kapalı.

**Risk:** Kullanıcılar, HaveIBeenPwned.org'da bulunan sızdırılmış şifreleri kullanabilir.

**Çözüm:** Manuel olarak Supabase Dashboard'dan aktive edin.

---

## 🚀 Uygulama Adımları

### Adım 1: Function Security Migration'ı Çalıştır

```sql
-- Supabase SQL Editor'da çalıştırın
-- supabase/migrations/20251123000006_security_fixes.sql
```

**Beklenen:** "No rows returned" (başarılı)

**Doğrulama:**
```sql
-- Function'ları kontrol et
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

---

### Adım 2: Leaked Password Protection'ı Aktive Et

#### Supabase Dashboard Üzerinden:

1. **Supabase Dashboard** → Project seçin
2. **Authentication** menüsüne git
3. **Policies** tab'ına tıkla
4. **"Password Protection"** bölümünü bul
5. **"Enable Leaked Password Protection"** toggle'ını aktif et
6. **Save** butonuna bas

#### Alternatif: SQL ile (Eğer erişim varsa)

```sql
-- Supabase Admin kontrolü gerektirir
-- Dashboard üzerinden yapmanız önerilir
```

---

## ✅ Doğrulama

### Function Search Path - Doğrulama

Migration'dan sonra Supabase Linter'ı tekrar çalıştırın:

```bash
# Supabase Dashboard > Database > Linter
```

**Beklenen:** Function search_path uyarıları kaybolmalı ✅

### Leaked Password Protection - Doğrulama

1. Supabase Dashboard > Authentication > Policies
2. "Password Protection" bölümünde **"Enabled"** yazmalı

**Test:**
```typescript
// Yeni kullanıcı kaydı yaparken sızdırılmış şifre deneyin
const { data, error } = await supabase.auth.signUp({
  email: 'test@test.com',
  password: 'password123' // Sızdırılmış şifre
})

// BEKLENEN: error.message içinde "password has been found in a breach" uyarısı
```

---

## 📊 Güvenlik İyileştirmeleri Özeti

| Öncesi | Sonrası | İyileşme |
|--------|---------|----------|
| 14 function search_path açık | 0 açık | ✅ 100% güvenli |
| Leaked password koruması YOK | Aktif | ✅ Şifre güvenliği artırıldı |

---

## 🔍 Teknik Detaylar

### Search Path Nedir?

PostgreSQL'de `search_path`, hangi schema'ların hangi sırayla aranacağını belirler:

```sql
-- Örnek: Varsayılan search_path
SHOW search_path;
-- Sonuç: "$user", public
```

### Search Path Injection Saldırısı

```sql
-- Kötü niyetli kullanıcı:
CREATE SCHEMA evil;
CREATE FUNCTION evil.auth.uid() RETURNS UUID AS $$
BEGIN
  -- Farklı user_id döndür
  RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql;

-- Eğer function search_path belirtmemişse:
SET search_path = evil, public;

-- Artık auth.uid() çağrıları evil.auth.uid() çalıştırır!
```

### Nasıl Korunuruz?

Function tanımında search_path'i sabitle:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ← Bu satır korur
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$;
```

Artık kullanıcı search_path'i değiştirse bile function **sadece public schema**'da arama yapar.

---

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. SECURITY DEFINER Functions

`SECURITY DEFINER` olan function'lar **function owner'ın yetkisiyle** çalışır.

**Risk:** Search path injection ile yetkisiz erişim

**Çözüm:** ✅ Her SECURITY DEFINER function'da search_path set edildi

### 2. Auth Schema

`auth.uid()` gibi Supabase Auth function'ları `auth` schema'sında.

**Önemli:** Migration'da `SET search_path = public, pg_temp` dedik ama `auth.uid()` çağrısını **tam qualified** yazdık:

```sql
-- ✅ DOĞRU
WHERE id = auth.uid()

-- ❌ YANLIŞ (eğer search_path'te auth yoksa)
WHERE id = uid()
```

### 3. Extension Functions

PostgreSQL extension'larından gelen function'lar (uuid_generate_v4, pgcrypto, vb.) dikkatli kullanılmalı.

**Güvenlik:** ✅ Migration'da tüm extension function'ları tam qualified kullanıldı

---

## 🎯 Sonuç

Bu migration ile:

- ✅ **Search path injection saldırıları** engellendi
- ✅ **14 güvenlik uyarısı** giderildi
- ✅ **Function güvenliği** artırıldı
- ⚠️ **Leaked password protection** manuel olarak aktive edilmeli

---

## 📞 Sorun mu Yaşıyorsunuz?

### Function hata veriyor

Eğer migration sonrası function'lar hata veriyorsa:

```sql
-- Function detaylarını incele
\df+ function_name

-- Error log'larını kontrol et
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
```

### RLS politikaları çalışmıyor

```sql
-- Politikaları kontrol et
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test et
SET ROLE authenticated;
SELECT * FROM credits WHERE user_id = auth.uid();
```

---

**Son Güncelleme:** 2025-11-23
**Migration File:** `20251123000006_security_fixes.sql`
