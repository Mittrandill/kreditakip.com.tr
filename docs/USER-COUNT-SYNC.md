# Kullanıcı Sayısı Senkronizasyonu

## ❓ Sorun: "Toplam Kullanıcı" Sayısı Yanlış Gösteriyor

Admin dashboard'da **"Toplam Kullanıcı"** kartı, `profiles` tablosundaki kayıt sayısını gösterir. Eğer bu sayı gerçek kullanıcı sayısından (auth.users) farklıysa, profiles ve auth.users tabloları senkronize değildir.

## 🔍 Nedenler

### 1. Trigger Eksik veya Çalışmıyor
Yeni kullanıcı kaydı yapıldığında, auth.users'a kayıt ekleniyor ama profiles tablosuna otomatik olarak eklenmiyor.

### 2. Manuel Kullanıcı Ekleme
Eğer auth.users'a manuel (Supabase Dashboard'dan) kullanıcı eklediyseniz, profiles tablosuna da manuel eklemeniz gerekir.

### 3. Eski Kayıtlar
Trigger oluşturulmadan önce kayıt olan kullanıcılar profiles tablosunda olmayabilir.

## ✅ Çözüm

### Adım 1: Kontrol Edin
Supabase Dashboard > SQL Editor'de aşağıdaki komutu çalıştırın:

\`\`\`sql
-- scripts/48-check-users-count.sql dosyasını çalıştırın
\`\`\`

Bu size şunları gösterecek:
- `auth.users` tablosundaki toplam kullanıcı sayısı
- `profiles` tablosundaki toplam kullanıcı sayısı
- Eksik profil sayısı
- Detaylı karşılaştırma

**Sonuç:**
\`\`\`
auth.users: 5
profiles: 1
Eksik profil: 4
\`\`\`

Eğer eksik profil varsa, devam edin.

### Adım 2: Trigger Oluşturun ve Eksikleri Tamamlayın

\`\`\`sql
-- scripts/49-create-profile-trigger.sql dosyasını çalıştırın
\`\`\`

Bu script:
1. ✅ Trigger fonksiyonu oluşturur (handle_new_user)
2. ✅ Trigger'ı auth.users'a bağlar
3. ✅ Mevcut auth.users kayıtları için profiles oluşturur
4. ✅ Sonuçları gösterir

**Çalıştırdıktan sonra:**
\`\`\`
Trigger oluşturuldu ve eksik profiller eklendi
auth_users_count: 5
profiles_count: 5
eksik_profil_sayisi: 0
\`\`\`

### Adım 3: Doğrulama

Admin dashboard'u yenileyin:
- "Toplam Kullanıcı" sayısı artık doğru olmalı
- Yeni kayıt olan kullanıcılar otomatik olarak profiles'a eklenecek

## 📊 Veri Akışı

### Doğru Akış (Trigger ile)
\`\`\`
1. Kullanıcı kayıt olur
   ↓
2. auth.users'a eklenir
   ↓
3. Trigger tetiklenir
   ↓
4. profiles'a otomatik eklenir
   ↓
5. Dashboard doğru sayıyı gösterir ✅
\`\`\`

### Yanlış Akış (Trigger olmadan)
\`\`\`
1. Kullanıcı kayıt olur
   ↓
2. auth.users'a eklenir
   ↓
3. Trigger YOK
   ↓
4. profiles'a EKLENMİYOR ❌
   ↓
5. Dashboard eksik sayı gösterir
\`\`\`

## 🔧 Trigger Fonksiyonu Detayları

### handle_new_user() Fonksiyonu
\`\`\`sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,      -- auth.users'daki ID
    new.email,   -- auth.users'daki email
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

### Trigger
\`\`\`sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
\`\`\`

## 🎯 Profiles Tablosu Yapısı

Minimum sütunlar (trigger için):
- `id` (UUID, PRIMARY KEY, auth.users.id ile aynı)
- `email` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

Opsiyonel sütunlar:
- `full_name` (TEXT)
- `phone` (TEXT)
- `is_admin` (BOOLEAN)
- `avatar_url` (TEXT)
- vb.

## 🐛 Sorun Giderme

### Trigger çalışmıyor
\`\`\`sql
-- Trigger'ı kontrol edin
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Trigger yoksa yeniden oluşturun
-- scripts/49-create-profile-trigger.sql
\`\`\`

### Manuel senkronizasyon gerekli
\`\`\`sql
-- Eksik profilleri manuel ekleyin
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.created_at,
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
\`\`\`

### RLS Sorunları
Eğer admin bile profilleri göremiyor ise:
\`\`\`sql
-- RLS politikalarını kontrol edin
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Gerekirse admin için özel policy ekleyin
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
\`\`\`

## 📝 Özet

1. **Sorun**: auth.users ve profiles senkronize değil
2. **Neden**: Trigger eksik
3. **Çözüm**: `scripts/49-create-profile-trigger.sql` çalıştır
4. **Sonuç**: Otomatik senkronizasyon + eski kayıtlar düzeltildi

## 🔗 İlgili Script Dosyaları

- `scripts/48-check-users-count.sql` - Sayıları kontrol et
- `scripts/49-create-profile-trigger.sql` - Trigger oluştur ve düzelt

---

**Not:** Bu trigger, yeni kullanıcı kaydolduğunda sadece temel bilgileri (id, email) kopyalar. `full_name`, `phone` gibi alanlar kullanıcı profil güncelleme sayfasında doldurulmalıdır.
