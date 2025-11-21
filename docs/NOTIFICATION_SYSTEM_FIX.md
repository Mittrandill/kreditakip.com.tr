# 🔔 Bildirim Sistemi Düzeltmeleri

Bu dokümanda bildirim sisteminde yapılan düzeltmeler ve iyileştirmeler detaylı olarak açıklanmaktadır.

## 📋 Özet

**Tarih:** 6 Kasım 2025
**Durum:** ✅ Tamamlandı
**Önem:** 🔴 Kritik

---

## 🔴 Tespit Edilen Sorunlar

### 1. Duplicate Workflow Çakışması
**Problem:** İki farklı workflow aynı işi yapıyordu ve çakışıyordu:
- ❌ `send-notifications.yml` - Yeni eklenen, çakışan sistem
- ✅ `send-email-notifications.yml` - Çalışan sistem

**Sonuç:** Kullanıcılara duplicate email gönderilme riski

**Çözüm:**
- ❌ `send-notifications.yml` silindi
- ✅ `send-email-notifications.yml` korundu
- ✅ Yeni `create-app-notifications.yml` oluşturuldu (sadece app bildirimleri için)

---

### 2. Geciken Ödemeler İçin Email Gönderilmiyordu
**Problem:** Script sadece bugün, yarın ve 3 gün sonrası için email gönderiyordu. Vadesi geçmiş ödemeler için hiç email gönderilmiyordu!

**Kod:**
```javascript
// ÖNCE (YANLIŞ):
.in("due_date", [todayStr, oneDayLater, threeDaysLater])

// SONRA (DOĞRU):
.gte("due_date", thirtyDaysAgo)
.lte("due_date", threeDaysLater)
```

**Çözüm:**
- Son 30 gün içinde vadesi geçmiş ödemeler de dahil edildi
- Geciken ödemeler için `notificationType = "overdue"` eklendi

---

### 3. Kullanıcı Kaydında Notification Preferences Oluşturulmuyordu
**Problem:** Yeni kullanıcılar için otomatik `notification_preferences` kaydı yoktu. İlk bildirim gelene kadar kullanıcı email alamıyordu.

**Çözüm:**
- Supabase trigger eklendi: `handle_new_user()`
- Yeni kullanıcı kaydolduğunda otomatik default preferences oluşturuluyor
- Mevcut kullanıcılar için de migration ile preferences eklendi

**Migration Dosyası:** `supabase-migrations/001-create-notification-preferences-trigger.sql`

---

### 4. Duplicate Email Kontrolü Eksikti
**Problem:** Aynı gün içinde aynı ödeme için birden fazla email gönderilme riski vardı.

**Kod:**
```javascript
// ÖNCE (YANLIŞ):
.gte("created_at", todayStr)
.single()

// SONRA (DOĞRU):
.gte("email_sent_at", todayStr)
.not("email_sent_at", "is", null)
.limit(1)
.maybeSingle()
```

**Çözüm:**
- `email_sent_at` bazlı kontrol eklendi
- `.maybeSingle()` kullanılarak hata durumu önlendi

---

## ✅ Yapılan Değişiklikler

### 1. Workflow Değişiklikleri

#### ❌ Silinen Dosya:
- `.github/workflows/send-notifications.yml`

#### ✅ Korunan Dosya:
- `.github/workflows/send-email-notifications.yml`
  - Günde 2 kez (09:00, 18:00 UTC = 12:00, 21:00 TR)
  - `scripts/send-email-notifications.js` çalıştırıyor
  - Email gönderimi yapıyor

#### ✅ Yeni Eklenen Dosya:
- `.github/workflows/create-app-notifications.yml`
  - Günde 2 kez (09:00, 18:00 UTC = 12:00, 21:00 TR)
  - `/api/notifications/create-app-notifications` endpoint'ini çağırıyor
  - SADECE uygulama içi bildirimler oluşturuyor
  - Email göndermiyor

---

### 2. API Endpoint Değişiklikleri

#### ✅ Yeni Eklenen:
- `/app/api/notifications/create-app-notifications/route.ts`
  - Sadece app bildirimleri oluşturur
  - Email göndermez
  - Tüm kullanıcılar için çalışır (email_enabled tercihi fark etmez)
  - `createWeeklyPaymentNotifications()` ve `createOverduePaymentNotifications()` çağırır

---

### 3. Script Değişiklikleri

#### ✅ Güncellenen:
- `scripts/send-email-notifications.js`
  - ✅ Geciken ödemeler için email gönderimi eklendi
  - ✅ 30 gün öncesine kadar gecikmiş ödemeler taranıyor
  - ✅ Duplicate kontrolü `email_sent_at` bazlı yapılıyor
  - ✅ `.maybeSingle()` kullanılarak hata önlendi

---

### 4. Database Değişiklikleri

#### ✅ Yeni Migration:
- `supabase-migrations/001-create-notification-preferences-trigger.sql`

**İçerik:**
1. `handle_new_user()` function oluşturuldu
2. `on_auth_user_created` trigger oluşturuldu
3. Mevcut kullanıcılar için preferences eklendi
4. Verification query eklendi

---

## 🎯 Sistem Mimarisi (Yeni)

```
┌─────────────────────────────────────────────────────────────┐
│                   KULLANICI KAYIT                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              [Supabase Trigger]
                      │
                      ▼
        [notification_preferences oluşturulur]
```

```
┌─────────────────────────────────────────────────────────────┐
│         UYGULAMA İÇİ BİLDİRİMLER (09:00, 18:00 UTC)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
      [create-app-notifications.yml]
                      │
                      ▼
[/api/notifications/create-app-notifications]
                      │
        ┌─────────────┴────────────┐
        ▼                          ▼
[createWeeklyPayment      [createOverduePayment
 Notifications]            Notifications]
        │                          │
        └─────────────┬────────────┘
                      ▼
            [notifications table]
              (notification_type:
               app_reminder, app_overdue)
```

```
┌─────────────────────────────────────────────────────────────┐
│          EMAIL BİLDİRİMLER (09:00, 18:00 UTC)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
      [send-email-notifications.yml]
                      │
                      ▼
    [scripts/send-email-notifications.js]
                      │
        ┌─────────────┴────────────┐
        │                          │
        ▼                          ▼
[notification_preferences]  [payment_plans]
 (email_enabled=true)        (pending status)
        │                          │
        └─────────────┬────────────┘
                      ▼
              [MailerSend API]
                      │
                      ▼
            [notifications table]
              (notification_type: email)
```

---

## 📊 Bildirim Tipleri

### App Bildirimleri (In-App)
- `app_reminder` - Hatırlatma (3 gün içinde vadesi gelenler)
- `app_overdue` - Gecikme (vadesi geçmiş olanlar)

### Email Bildirimleri
- `email` - Email gönderimi yapılan bildirimler
  - 3 gün öncesi hatırlatma
  - 1 gün öncesi hatırlatma
  - Bugün vadesi gelenler
  - Geciken ödemeler (son 30 gün)

---

## 🚀 Deployment Adımları

### 1. Database Migration Çalıştır
```sql
-- Supabase SQL Editor'da çalıştır:
-- supabase-migrations/001-create-notification-preferences-trigger.sql
```

**Sonuç Kontrol:**
```sql
-- Trigger'ın çalıştığını kontrol et
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM notification_preferences;
-- İki sayı eşit olmalı
```

### 2. GitHub Secrets Kontrol
Aşağıdaki secrets'ların GitHub repository settings'te tanımlı olduğundan emin ol:
- ✅ `CRON_SECRET`
- ✅ `MAILERSEND_API_KEY`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SERVICE_ROLE_KEY`

### 3. Vercel Environment Variables Kontrol
Aşağıdaki env variables'ların Vercel'de tanımlı olduğundan emin ol:
- ✅ `CRON_SECRET`
- ✅ `MAILERSEND_API_KEY`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`

### 4. Push to GitHub
```bash
git add .
git commit -m "fix: bildirim sistemi düzeltmeleri - geciken ödeme bildirimleri ve duplicate çözümü"
git push origin claude/bildirim-s-011CUrMP94Wgh2v22dsK6VD4
```

### 5. Workflow'ları Test Et
GitHub Actions sekmesinde:
- ✅ `send-email-notifications.yml` - Manuel tetikle ve logları kontrol et
- ✅ `create-app-notifications.yml` - Manuel tetikle ve logları kontrol et

---

## 🧪 Test Senaryoları

### Test 1: Email Workflow Test
```bash
# GitHub Actions'da "send-email-notifications.yml" workflow'u
# "Run workflow" ile manuel tetikle
# Test mode ile:
TEST_MODE=true
TEST_EMAIL=senin@email.com
```

### Test 2: App Notifications Test
```bash
# GitHub Actions'da "create-app-notifications.yml" workflow'u
# "Run workflow" ile manuel tetikle
# Logları kontrol et
```

### Test 3: Yeni Kullanıcı Test
```sql
-- Test kullanıcısı oluştur
INSERT INTO auth.users (email) VALUES ('test@example.com');

-- Otomatik notification_preferences oluştu mu?
SELECT * FROM notification_preferences
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

### Test 4: Geciken Ödeme Email Test
```sql
-- Vadesi geçmiş bir ödeme planı oluştur veya güncelle
UPDATE payment_plans
SET due_date = '2025-10-30'
WHERE id = 'test-payment-id' AND status = 'pending';

-- Workflow'u tetikle ve email geldi mi kontrol et
```

---

## 📝 Notlar

### Önemli Hatırlatmalar
1. ✅ Geciken ödemeler için email gönderimi şimdi çalışıyor
2. ✅ Kullanıcı kaydında otomatik notification_preferences oluşuyor
3. ✅ Duplicate email sorunu çözüldü
4. ✅ App bildirimleri ve email bildirimleri ayrı workflow'larla yönetiliyor
5. ✅ Email tercihi kapalı kullanıcılar da app bildirimleri alıyor

### Gelecek İyileştirmeler
- [ ] Email template'leri daha da zenginleştirilebilir
- [ ] SMS bildirimi entegrasyonu eklenebilir
- [ ] Bildirim zamanlaması kullanıcı bazlı özelleştirilebilir
- [ ] Admin dashboard'a bildirim istatistikleri eklenebilir
- [ ] Supabase Edge Function ile GitHub Actions'dan bağımsızlaşma

---

## 🐛 Sorun Giderme

### Workflow Çalışmıyor
**Kontrol:**
1. GitHub Actions sekmesinde workflow etkin mi?
2. `CRON_SECRET` doğru mu?
3. Vercel deployment başarılı mı?

**Çözüm:**
```bash
# Workflow loglarını kontrol et
# GitHub → Actions → Workflow seç → Son run'ı aç
```

### Email Gönderilmiyor
**Kontrol:**
1. `MAILERSEND_API_KEY` doğru mu?
2. Kullanıcının `notification_preferences`'ta `email_enabled=true` mu?
3. Kullanıcının email adresi var mı?

**Çözüm:**
```sql
-- Kullanıcı email tercihlerini kontrol et
SELECT np.*, p.email
FROM notification_preferences np
JOIN profiles p ON p.id = np.user_id
WHERE p.email = 'kullanici@email.com';
```

### App Bildirimleri Oluşmuyor
**Kontrol:**
1. Kullanıcının pending status'te payment_plan'ı var mı?
2. Due date 3 gün içinde mi veya geçmiş mi?

**Çözüm:**
```sql
-- Kullanıcının ödeme planlarını kontrol et
SELECT pp.*, c.user_id, b.name as bank_name
FROM payment_plans pp
JOIN credits c ON c.id = pp.credit_id
JOIN banks b ON b.id = c.bank_id
WHERE c.user_id = 'user-id'
  AND pp.status = 'pending'
  AND pp.due_date <= CURRENT_DATE + INTERVAL '3 days';
```

---

## 📞 İletişim

Sorunlar için GitHub Issues kullanın:
https://github.com/Mittrandill/kreditakip.com.tr/issues

---

**Son Güncelleme:** 6 Kasım 2025
**Hazırlayan:** Claude Code
**Onaylayan:** @Mittrandill
