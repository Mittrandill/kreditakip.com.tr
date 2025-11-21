# Security Checklist - Supabase Database

## 🔴 Kritik - Hemen Yapılmalı

### 1. RLS (Row Level Security) Aktif Et
- [ ] `database-security-fixes.sql` dosyasını Supabase SQL Editor'de çalıştır
- [ ] `subscription_plans` tablosuna RLS ekle
- [ ] `request_logs` tablosuna RLS ekle
- [ ] Test et: Normal kullanıcı olarak subscription_plans'i okuyabilir misin?

**Risk:** Herkes veritabanına doğrudan erişebilir!

---

## 🟡 Önemli - 1 Hafta İçinde Yapılmalı

### 2. Auth Ayarları
Supabase Dashboard > Authentication > Settings:

- [ ] **OTP Expiry:** 3600 saniye (1 saat) yap
  - Şu an: >3600 saniye
  - Hedef: 3600 saniye

- [ ] **Leaked Password Protection:** Aktif et
  - Settings > Password Security > Enable "Leaked password protection"
  - HaveIBeenPwned.org kontrolü

- [ ] **Password Strength:** Minimum 8 karakter kontrol et

### 3. Function Security
- [ ] 23 function için `search_path` ayarla
  - Örnek: `ALTER FUNCTION function_name() SET search_path = public, pg_temp;`
  - Veya toplu: `database-function-security.sql` oluştur

---

## 🔵 Planlı - 1 Ay İçinde

### 4. Database Upgrade
- [ ] Postgres sürümünü kontrol et
  - Şu an: supabase-postgres-17.4.1.043
  - Hedef: En son güvenlik yaması

- [ ] Bakım penceresi planla (gece 02:00-04:00)
- [ ] Backup al
- [ ] Upgrade yap: Dashboard > Settings > Infrastructure > Upgrade

**Downtime:** ~5-10 dakika

---

## 📊 Test Checklist

### RLS Test (Critical)
```sql
-- Admin olmayan bir kullanıcı ile test et:

-- 1. Subscription plans okuyabilmeli
SELECT * FROM subscription_plans WHERE is_active = true;
-- Beklenen: Başarılı

-- 2. Subscription plans yazamamalı
INSERT INTO subscription_plans (id, name) VALUES ('test', 'Test');
-- Beklenen: Hata

-- 3. Başkasının request_logs'unu görememeli
SELECT * FROM request_logs WHERE user_id != auth.uid();
-- Beklenen: Boş sonuç

-- 4. Kendi request_logs'unu görebilmeli
SELECT * FROM request_logs WHERE user_id = auth.uid();
-- Beklenen: Kendi logları
```

### Auth Test
```bash
# 1. Zayıf şifre dene (leaked password protection test)
curl -X POST https://your-project.supabase.co/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Beklenen: Hata (leaked password)

# 2. OTP expiry test
# OTP al, 1 saatten sonra kullanmayı dene
# Beklenen: Expired hatası
```

---

## 🎯 Öncelik Sırası

1. **ŞİMDİ:** RLS aktif et (`database-security-fixes.sql`)
2. **BU HAFTA:** Auth ayarlarını düzelt
3. **BU AY:** Function security düzelt
4. **PLANLI:** Database upgrade

---

## 🚨 PayTR Migration İlişkisi

**Soru:** Bu güvenlik sorunları PayTR migration'ı etkiler mi?

**Cevap:** HAYIR, ancak:
- RLS yoksa herkes subscription_plans'i değiştirebilir
- Bu PayTR fiyatlarını manipüle etmeye izin verebilir
- **ÖNCE RLS'i aktif et, SONRA PayTR migration yap**

---

## 📝 Notlar

- **RLS olmadan production'a çıkmayın!**
- Auth ayarları kullanıcı deneyimini etkiler
- Function security SQL injection'a karşı korur
- Database upgrade planlı downtime gerektirir
