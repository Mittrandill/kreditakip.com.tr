# Admin Panel Giriş Sistemi

## 📌 Genel Bakış

Admin paneli artık kendi giriş sistemi ile korunmaktadır. Normal kullanıcı girişinden bağımsız olarak çalışır.

## 🔐 Nasıl Çalışır?

### Admin Giriş Akışı

1. Kullanıcı `/admin` adresine gider
2. Giriş yapmamışsa → `/admin/giris` sayfasına yönlendirilir
3. Admin giriş sayfasında e-posta ve şifre ile giriş yapar
4. Sistem kontroller:
   - ✅ E-posta ve şifre doğru mu?
   - ✅ Kullanıcının `is_admin = true` bayrağı var mı?
5. Her iki kontrol de geçerse → `/admin` dashboard'a yönlendirilir
6. Admin değilse → Otomatik çıkış yapılır ve hata mesajı gösterilir

### Güvenlik Özellikleri

- **Ayrı Giriş Sistemi**: Normal kullanıcı girişinden tamamen bağımsız
- **Admin Kontrolü**: Sadece `is_admin = true` olan kullanıcılar erişebilir
- **Otomatik Çıkış**: Admin yetkisi olmayan kullanıcılar otomatik çıkış yaptırılır
- **Session Kontrolü**: Her sayfada admin yetkisi kontrol edilir
- **Güvenli Çıkış**: Çıkış butonu ile session temizlenir

## 🚀 Kurulum

### 1. Admin Kullanıcı Oluşturma

Önce normal kayıt sürecini tamamlayın:
```
1. /kayit-ol sayfasına gidin
2. E-posta ve şifre ile kayıt olun
3. Email doğrulamasını yapın
```

### 2. Admin Yetkisi Verme

Supabase Dashboard > SQL Editor'de:

```sql
-- Email ile admin yetkisi verme
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@kreditakip.com.tr';

-- Kontrol
SELECT id, email, full_name, is_admin
FROM public.profiles
WHERE is_admin = true;
```

**Alternatif:** `scripts/47-set-admin-user.sql` dosyasını kullanabilirsiniz.

### 3. Admin Panel'e Giriş

```
1. https://kreditakip.com.tr/admin adresine gidin
2. E-posta ve şifrenizi girin
3. "Admin Girişi" butonuna tıklayın
4. Dashboard'a yönlendirileceksiniz
```

## 📁 Dosya Yapısı

```
app/
├── admin/
│   ├── giris/
│   │   ├── page.tsx          # Admin giriş sayfası
│   │   └── layout.tsx        # Giriş sayfası için basit layout
│   ├── layout.tsx            # Admin panel layout (sidebar, logout)
│   ├── page.tsx              # Dashboard
│   ├── kullanicilar/         # Kullanıcı yönetimi
│   ├── faturalar/            # Fatura yönetimi
│   └── blog/                 # Blog yönetimi

components/
└── admin-logout-button.tsx   # Çıkış butonu component'i

lib/
└── admin-check.ts            # Admin yetki kontrol fonksiyonu
```

## 🎨 Admin Giriş Sayfası Özellikleri

### Görsel Tasarım
- 🎨 Gradient arka plan (slate-purple)
- 🛡️ Shield ikonu ile profesyonel görünüm
- 💎 Glassmorphism efekti
- 📱 Responsive tasarım

### Form Özellikleri
- ✅ E-posta ve şifre alanları
- ✅ Loading state ile buton
- ✅ Hata mesajları (kırmızı alert)
- ✅ Auto-complete desteği
- ✅ Disabled state (loading sırasında)

### Hata Mesajları
- "E-posta veya şifre hatalı" - Giriş bilgileri yanlışsa
- "Giriş yapılamadı" - Auth hatası
- "Kullanıcı bilgileri alınamadı" - Profile sorgusu başarısızsa
- "Bu hesabın admin yetkisi bulunmuyor" - Admin değilse

## 🔄 Admin Panel Akışı

### Giriş Sonrası
```
/admin/giris → Auth Check → Admin Check → /admin (Dashboard)
                   ↓              ↓
                 FAIL          FAIL
                   ↓              ↓
              Hata Mesajı    Çıkış + Hata
```

### Sidebar İçeriği
- 📊 Dashboard
- 👥 Kullanıcılar
- 💰 Faturalar
- 📝 Blog Yazıları
- 📁 Kategoriler
- 🏠 Ana Sayfaya Dön
- 🚪 Çıkış Yap (alt kısımda)

### Çıkış Yapma
1. Sidebar'da "Çıkış Yap" butonuna tıklayın
2. Session temizlenir
3. `/admin/giris` sayfasına yönlendirilir

## 🔒 Güvenlik

### checkAdminAccess() Fonksiyonu

```typescript
// lib/admin-check.ts

1. Session var mı? → Yoksa /admin/giris
2. Profile çekiliyor
3. is_admin = true mu? → Değilse çıkış yap + /admin/giris
4. Her şey OK → Session ve profile döndür
```

### Korunan Sayfalar

Tüm `/admin/*` sayfaları (giriş hariç) `checkAdminAccess()` ile korunur:
- `/admin` - Dashboard
- `/admin/kullanicilar` - Kullanıcı listesi
- `/admin/kullanicilar/[id]` - Kullanıcı detay
- `/admin/faturalar` - Fatura listesi
- `/admin/faturalar/yeni` - Yeni fatura
- `/admin/blog/*` - Blog sayfaları

## 📱 Kullanım Örnekleri

### Admin Olarak Giriş
```
1. /admin → /admin/giris (redirect)
2. E-posta: admin@kreditakip.com.tr
3. Şifre: ********
4. Giriş Yap
5. ✓ Dashboard açılır
```

### Normal Kullanıcı Denerse
```
1. /admin → /admin/giris (redirect)
2. E-posta: user@kreditakip.com.tr
3. Şifre: ********
4. Giriş Yap
5. ✗ "Bu hesabın admin yetkisi bulunmuyor"
6. Otomatik çıkış yapılır
```

### Çıkış Yapma
```
1. Admin Panel → Sidebar → "Çıkış Yap"
2. Session temizlenir
3. /admin/giris sayfasına yönlendirilir
```

## 🎯 Kullanıcı Deneyimi

### İlk Giriş
1. Admin kullanıcı oluşturulur (SQL)
2. `/admin` adresine gidilir
3. Otomatik `/admin/giris` sayfasına yönlendirilir
4. Güzel bir giriş ekranı karşılar
5. Giriş yapılır
6. Dashboard açılır

### Sonraki Girişler
- Session varsa direkt dashboard açılır
- Session yoksa giriş sayfası gösterilir
- Çıkış yapınca tekrar giriş gerekir

## 🚨 Önemli Notlar

1. **Admin Yetkisi**: Sadece SQL ile verilir, arayüzden verilemez
2. **Session Yönetimi**: Her sayfa yüklemede kontrol edilir
3. **Çıkış**: Otomatik veya manuel olabilir
4. **Güvenlik**: Admin olmayan kullanıcılar asla erişemez
5. **Bağımsız**: Normal kullanıcı girişinden tamamen ayrı

## 🐛 Sorun Giderme

### "E-posta veya şifre hatalı" hatası
- Giriş bilgilerinizi kontrol edin
- Şifre doğrulama için `/sifremi-unuttum` kullanın

### "Bu hesabın admin yetkisi bulunmuyor"
```sql
-- Kontrol edin:
SELECT is_admin FROM profiles WHERE email = 'sizin@email.com';

-- Eğer false ise:
UPDATE profiles SET is_admin = true WHERE email = 'sizin@email.com';
```

### Sürekli giriş sayfasına yönlendiriliyor
- Browser console'u kontrol edin
- Session cookie'leri silin
- Yeniden giriş yapın

### Admin yetkisi verdiğim halde giremiyorum
1. Cache temizleyin (Ctrl + F5)
2. Tarayıcıyı kapatıp açın
3. Database'de tekrar kontrol edin

## 📖 İlgili Dokümantasyon

- **Genel Kurulum**: `docs/ADMIN-SETUP.md`
- **Hızlı Başlangıç**: `docs/ADMIN-QUICK-START.md`
- **SQL Script**: `scripts/47-set-admin-user.sql`
- **Test Sayfası**: `/admin-test` (opsiyonel debug için)

---

**Admin paneli artık güvenli ve kullanıcı dostu bir giriş sistemi ile korunmaktadır!** 🎉
