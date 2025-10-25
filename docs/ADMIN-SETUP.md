# Admin Panel Kurulum ve Kullanım Kılavuzu

Bu dokümantasyon, KrediTakip uygulamasının admin panelinin nasıl kurulacağını ve kullanılacağını açıklar.

## İçindekiler

1. [Admin Kullanıcı Oluşturma](#admin-kullanıcı-oluşturma)
2. [Database Kurulumu](#database-kurulumu)
3. [Storage Bucket Kurulumu](#storage-bucket-kurulumu)
4. [Admin Panel Erişimi](#admin-panel-erişimi)
5. [Özellikler](#özellikler)

---

## Admin Kullanıcı Oluşturma

Admin kullanıcı oluşturmak için Supabase SQL Editor'ü kullanmanız gerekmektedir.

### Adım 1: Kullanıcıyı Normal Şekilde Kaydedin

Öncelikle admin yapmak istediğiniz kullanıcının normal kayıt sürecinden geçmesini sağlayın:
1. `/kayit-ol` sayfasından kayıt olun
2. E-posta doğrulamasını yapın
3. Giriş yapın

### Adım 2: Admin Yetkisi Verin

Supabase Dashboard'a gidin ve SQL Editor'de aşağıdaki komutu çalıştırın:

```sql
-- E-posta ile admin yetkisi verme
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@kreditakip.com.tr';

-- Veya User ID ile admin yetkisi verme
UPDATE public.profiles
SET is_admin = true
WHERE id = 'kullanıcı-uuid-buraya';
```

### Adım 3: Admin Yetkisini Kontrol Edin

Admin yetkisinin verildiğini kontrol etmek için:

```sql
SELECT id, email, full_name, is_admin, created_at
FROM public.profiles
WHERE is_admin = true;
```

---

## Database Kurulumu

Admin panel için gerekli database tablolarını oluşturmak için aşağıdaki SQL script'lerini sırayla çalıştırın:

### 1. Blog ve Admin Tabloları

```bash
# Script dosyası: scripts/45-create-admin-and-blog-tables.sql
```

Bu script:
- `profiles` tablosuna `is_admin` kolonu ekler
- `blog_categories` tablosu oluşturur
- `blog_posts` tablosu oluşturur
- RLS politikaları ve trigger'ları ayarlar

### 2. Fatura Tablosu

```bash
# Script dosyası: scripts/46-create-invoices-table.sql
```

Bu script:
- `invoices` tablosu oluşturur
- RLS politikaları ayarlar
- Storage bucket için policy örnekleri içerir

### SQL Script'lerini Çalıştırma

1. Supabase Dashboard > SQL Editor'e gidin
2. Script dosyasını açın
3. İçeriği kopyalayıp SQL Editor'e yapıştırın
4. "Run" butonuna tıklayın

---

## Storage Bucket Kurulumu

Fatura dosyalarını saklamak için Supabase Storage'da bir bucket oluşturmanız gerekmektedir.

### Adım 1: Bucket Oluşturma

1. Supabase Dashboard > Storage > "Create bucket" butonuna tıklayın
2. Bucket adı: `invoices`
3. Public access: **OFF** (private bucket)
4. "Create bucket" butonuna tıklayın

### Adım 2: Storage Policies Oluşturma

Supabase Dashboard > Storage > invoices bucket > Policies sekmesine gidin ve aşağıdaki policy'leri ekleyin:

#### Policy 1: Users can view their own invoices

```sql
CREATE POLICY "Users can view their own invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);
```

#### Policy 2: Only admins can upload invoices

```sql
CREATE POLICY "Only admins can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

#### Policy 3: Only admins can delete invoices

```sql
CREATE POLICY "Only admins can delete invoices"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## Admin Panel Erişimi

### Giriş Yapma

1. Normal kullanıcı olarak giriş yapın: `/giris`
2. Admin yetkisi olan hesapla giriş yaptıktan sonra:
   - URL'e `/admin` ekleyerek admin panele erişebilirsiniz
   - Örnek: `https://kreditakip.com.tr/admin`

### Admin Panel Navigasyonu

Admin panelde aşağıdaki bölümler bulunmaktadır:

- **Dashboard**: Genel istatistikler ve hızlı erişim
- **Kullanıcılar**: Tüm kullanıcıları görüntüleme ve yönetme
- **Faturalar**: Fatura oluşturma, yükleme ve takibi
- **Blog Yazıları**: Blog içeriklerini yönetme
- **Kategoriler**: Blog kategorilerini yönetme

---

## Özellikler

### 1. Kullanıcı Yönetimi

**Erişim:** `/admin/kullanicilar`

#### Özellikler:
- Tüm kullanıcıları listeleme
- Kullanıcı detaylarını görüntüleme
- Abonelik durumlarını kontrol etme
- Kullanıcı başına fatura ve kredi geçmişini görüntüleme

#### Kullanıcı Detay Sayfası:
**Erişim:** `/admin/kullanicilar/[id]`

Görüntülenen bilgiler:
- Kişisel bilgiler (ad, e-posta, telefon)
- Abonelik durumu ve plan bilgileri
- Fatura geçmişi
- Son krediler

### 2. Fatura Yönetimi

**Erişim:** `/admin/faturalar`

#### Özellikler:
- Tüm faturaları listeleme
- Fatura durumlarını görüntüleme (Ödendi, Bekliyor, Gecikmiş)
- Toplam gelir istatistikleri
- Kullanıcıya göre filtreleme

#### Yeni Fatura Oluşturma:
**Erişim:** `/admin/faturalar/yeni`

Adımlar:
1. Kullanıcı seçin
2. Fatura numarası girin (örn: INV-2025-001)
3. Fatura ve vade tarihlerini belirleyin
4. Tutarı girin
5. Açıklama ekleyin (opsiyonel)
6. PDF fatura dosyası yükleyin (opsiyonel)
7. "Fatura Oluştur" butonuna tıklayın

**Not:** Kullanıcı detay sayfasından da doğrudan fatura oluşturabilirsiniz.

### 3. Blog Yönetimi

**Erişim:** `/admin/blog/posts`

#### Özellikler:
- Blog yazıları oluşturma, düzenleme, silme
- Taslak ve yayın durumu yönetimi
- Kategori atama
- Görüntülenme sayıları

### 4. Kategori Yönetimi

**Erişim:** `/admin/blog/categories`

#### Özellikler:
- Kategori oluşturma ve düzenleme
- Slug yönetimi
- Kategori bazlı yazı sayıları

---

## Kullanıcı Tarafı Fatura Görüntüleme

Normal kullanıcılar kendi faturalarını görüntüleyebilir:

**Erişim:** `/uygulama/ayarlar` > "Faturalar" sekmesi

Kullanıcılar şunları görebilir:
- Fatura numarası ve tarihi
- Tutar ve durum
- Vade tarihi
- Fatura dosyasını indirme linki
- Ödeme tarihi (eğer ödendiyse)

---

## Güvenlik

### Row Level Security (RLS)

Tüm admin işlemleri için RLS politikaları aktiftir:

- Admin olmayan kullanıcılar admin panele erişemez
- Kullanıcılar sadece kendi faturalarını görebilir
- Fatura yükleme ve oluşturma sadece admin tarafından yapılabilir
- Blog yazıları ve kategoriler için CRUD işlemleri admin yetkisi gerektirir

### Yetki Kontrolü

Her admin sayfasında `checkAdminAccess()` fonksiyonu çalışır:
- Kullanıcı oturum açmamışsa `/giris` sayfasına yönlendirilir
- Admin yetkisi yoksa `/uygulama/ana-sayfa` sayfasına yönlendirilir

---

## Sorun Giderme

### Admin panele erişemiyorum

1. Kullanıcının `is_admin` flag'inin `true` olduğunu kontrol edin:
   ```sql
   SELECT id, email, is_admin FROM public.profiles WHERE email = 'kullanıcı-email';
   ```

2. Tarayıcı cache'ini temizleyin ve tekrar giriş yapın

### Fatura yüklenemiyor

1. Storage bucket'ının oluşturulduğunu kontrol edin
2. Storage policies'in doğru ayarlandığını kontrol edin
3. Dosya boyutunun 10MB'dan küçük olduğunu kontrol edin
4. Sadece PDF dosyalarının kabul edildiğini unutmayın

### Kullanıcılar faturalarını göremiyor

1. `invoices` tablosunda RLS policies'in aktif olduğunu kontrol edin
2. Kullanıcının `user_id` alanının doğru ayarlandığını kontrol edin
3. Browser console'da hata mesajlarını kontrol edin

---

## API Endpoints

Admin panel aşağıdaki API endpoint'lerini kullanır:

### Admin Endpoints

- `GET /api/admin/users` - Tüm kullanıcıları listele
- `POST /api/admin/invoices` - Yeni fatura oluştur
- `POST /api/admin/invoices/upload` - Fatura dosyası yükle
- `GET /api/admin/blog/posts` - Blog yazılarını listele
- `GET /api/admin/blog/categories` - Kategorileri listele

### Kullanıcı Endpoints

- `GET /api/user/invoices` - Kullanıcının kendi faturalarını listele

Tüm admin endpoint'leri admin yetkisi kontrolü yapar.

---

## Gelecek Geliştirmeler

Planlanan özellikler:

- [ ] Toplu fatura yükleme
- [ ] E-posta ile fatura gönderimi
- [ ] Otomatik fatura oluşturma (abonelik yenilemelerinde)
- [ ] Fatura şablonu düzenleyici
- [ ] Excel export özelliği
- [ ] Gelişmiş filtreleme ve arama
- [ ] Kullanıcı aktivite logları
- [ ] Admin yetki seviyeleri (super admin, editor, vb.)

---

## Destek

Sorunlar için GitHub Issues: https://github.com/[repo-adi]/issues
