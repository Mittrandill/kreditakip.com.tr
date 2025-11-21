# Admin Panel - Hızlı Başlangıç Kılavuzu

## 🚀 Kurulum Adımları

### 1. Database Script'lerini Çalıştırın

Supabase Dashboard > SQL Editor'de aşağıdaki script'leri sırayla çalıştırın:

\`\`\`sql
-- 1. Blog ve Admin tabloları
-- scripts/45-create-admin-and-blog-tables.sql dosyasını çalıştırın

-- 2. Fatura tablosu
-- scripts/46-create-invoices-table.sql dosyasını çalıştırın
\`\`\`

### 2. Storage Bucket Oluşturun

1. Supabase Dashboard > Storage > "Create bucket"
2. Bucket adı: **`invoices`**
3. Public: **OFF** (private)
4. "Create bucket" tıklayın

Storage policies için `docs/ADMIN-SETUP.md` dosyasına bakın.

### 3. Admin Kullanıcı Oluşturun

\`\`\`sql
-- Önce normal kayıt yapın, sonra admin yetkisi verin:
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@kreditakip.com.tr';
\`\`\`

### 4. Admin Panel'e Giriş

1. `/admin` adresine gidin (otomatik `/admin/giris`'e yönlendirileceksiniz)
2. E-posta ve şifrenizi girin
3. "Admin Girişi" butonuna tıklayın
4. Dashboard'dan işlemlerinize başlayın

**Not:** Admin paneli kendi giriş sistemine sahiptir. Normal kullanıcı girişinden bağımsızdır.

---

## 📊 Admin Panel Özellikleri

### Dashboard (`/admin`)
- Kullanıcı ve abonelik istatistikleri
- Gelir ve fatura durumları
- Blog istatistikleri
- Hızlı erişim butonları

### Kullanıcı Yönetimi (`/admin/kullanicilar`)
- Tüm kullanıcıları listeleme
- Kullanıcı detaylarını görüntüleme
- Abonelik durumlarını takip etme
- Kullanıcı başına fatura oluşturma

### Fatura Yönetimi (`/admin/faturalar`)
- Fatura listeleme ve filtreleme
- Yeni fatura oluşturma (`/admin/faturalar/yeni`)
- PDF yükleme
- Gelir istatistikleri

### Blog Yönetimi (`/admin/blog/posts`)
- Blog yazısı oluşturma, düzenleme, silme
- Kategori yönetimi
- Taslak ve yayın durumu kontrolü

---

## ✅ Kullanım Örnekleri

### Fatura Oluşturma

1. `/admin/faturalar/yeni` adresine gidin
2. Kullanıcıyı seçin
3. Fatura bilgilerini girin:
   - Fatura No: `INV-2025-001`
   - Tarih ve vade
   - Tutar: `299.00`
   - Durum: `pending` veya `paid`
4. PDF yükleyin (opsiyonel)
5. "Fatura Oluştur" butonuna tıklayın

### Kullanıcı Detayı Görüntüleme

1. `/admin/kullanicilar` adresine gidin
2. Kullanıcının "Detay" linkine tıklayın
3. Kullanıcı bilgileri, abonelik ve fatura geçmişini görün
4. "Fatura Oluştur" butonu ile direkt fatura oluşturun

---

## 🔒 Güvenlik

- Tüm admin endpoint'leri yetki kontrolü yapar
- RLS politikaları aktif
- Kullanıcılar sadece kendi faturalarını görebilir
- Dosya yükleme validasyonları mevcut (PDF, max 10MB)

---

## 👥 Kullanıcı Tarafı

Kullanıcılar kendi faturalarını şuradan görebilir:
- `/uygulama/ayarlar` > "Faturalar" sekmesi

Fatura özellikler:
- Fatura listesi ve durumları
- PDF indirme
- Ödeme durumu ve tarihleri
- İstatistikler

---

## 📝 Notlar

- Admin olmayan kullanıcılar `/admin` adresine giremez
- Admin flag'i database'den manuel olarak verilmelidir
- Faturalar private storage'da saklanır
- Her fatura kullanıcıya özeldir ve sadece o kullanıcı görebilir

---

## 🆘 Sorun mu yaşıyorsunuz?

Detaylı dokümantasyon için: `docs/ADMIN-SETUP.md`
