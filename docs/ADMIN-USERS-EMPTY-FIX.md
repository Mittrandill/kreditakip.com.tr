# Admin Kullanıcılar Sayfası Boş Gösteriyor - Çözüm

## ❗ Sorun

Admin panelde `/admin/kullanicilar` sayfasına gittiğinizde:
- ✅ Dashboard'da "Toplam Kullanıcı: X" gösteriyor
- ❌ Kullanıcılar sayfası "Henüz kullanıcı bulunmuyor" diyor
- 🤔 Database'de `profiles` tablosunda kayıt var

## 🔍 Neden?

**RLS (Row Level Security) Politikaları Sorunu**

Profiles tablosunda RLS aktif ama admin kullanıcıların diğer profilleri görmesine izin veren policy yok.

### RLS Nasıl Çalışır?

\`\`\`sql
-- Mevcut policy (muhtemelen böyle):
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);  -- Sadece kendi ID'si olanı görebilir
\`\`\`

Bu policy ile:
- ✅ Kullanıcı kendi profilini görebilir
- ❌ Admin bile başkalarının profilini göremez!

## ✅ Çözüm

### Adım 1: Hatayı Görun

`/admin/kullanicilar` sayfasına gidin. Eğer hata varsa kırmızı bir kutu göreceksiniz.

Örnek hata:
\`\`\`json
{
  "code": "42501",
  "message": "new row violates row-level security policy",
  "details": null,
  "hint": null
}
\`\`\`

### Adım 2: RLS Policy'leri Düzeltin

Supabase Dashboard > SQL Editor'de aşağıdaki script'i çalıştırın:

\`\`\`sql
-- scripts/50-fix-profiles-rls-for-admin.sql dosyasını çalıştırın
\`\`\`

Bu script:

1. ✅ **SELECT Policy** - Kullanıcılar kendi profilini, adminler herkesi görebilir
\`\`\`sql
CREATE POLICY "Users can view own profile, admins view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id  -- Kendi profilini görebilir
    OR
    EXISTS (         -- VEYA admin ise tüm profilleri görebilir
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
\`\`\`

2. ✅ **UPDATE Policy** - Kullanıcılar kendi profilini, adminler herkesi güncelleyebilir

3. ✅ **INSERT Policy** - Yeni profil ekleme izni

4. ✅ **DELETE Policy** - Sadece adminler silebilir

### Adım 3: Doğrulama

1. Sayfayı yenileyin (F5)
2. Artık tüm kullanıcıları görebilmelisiniz
3. Kullanıcı sayısı Dashboard ile aynı olmalı

## 🔐 Güvenlik

### Önceki Durum (Güvensiz)
\`\`\`
Admin → profiles tablosu → RLS → Sadece kendi profili
❌ Admin başkalarını göremiyor
\`\`\`

### Sonraki Durum (Güvenli ve Doğru)
\`\`\`
Normal User → profiles → RLS → Sadece kendi profili ✅
Admin User → profiles → RLS → Tüm profiller ✅
\`\`\`

## 🧪 Test

### Test 1: Normal Kullanıcı
\`\`\`sql
-- Normal kullanıcı olarak giriş yap
SELECT * FROM profiles;
-- Sonuç: Sadece kendi kaydını görür
\`\`\`

### Test 2: Admin Kullanıcı
\`\`\`sql
-- Admin kullanıcı olarak giriş yap
SELECT * FROM profiles;
-- Sonuç: Tüm kayıtları görür
\`\`\`

## 📊 RLS Policy Kontrolü

Mevcut policy'leri kontrol etmek için:

\`\`\`sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';
\`\`\`

Görmek istediğiniz policy'ler:
- ✅ `Users can view own profile, admins view all` (SELECT)
- ✅ `Users can update own profile, admins update all` (UPDATE)
- ✅ `Users can insert own profile` (INSERT)
- ✅ `Only admins can delete profiles` (DELETE)

## 🐛 Hala Çalışmıyor mu?

### 1. RLS Aktif mi?
\`\`\`sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- rowsecurity = true olmalı
\`\`\`

### 2. Admin Flag Doğru mu?
\`\`\`sql
SELECT id, email, is_admin
FROM profiles
WHERE email = 'sizin@emailiniz.com';
-- is_admin = true olmalı
\`\`\`

### 3. Session Doğru mu?
\`\`\`sql
SELECT auth.uid();
-- Admin kullanıcının ID'sini döndürmeli
\`\`\`

### 4. Policy Doğru Uygulandı mı?
\`\`\`sql
-- Admin kullanıcı olarak:
SELECT COUNT(*) FROM profiles;
-- Tüm kullanıcı sayısını döndürmeli

-- Normal kullanıcı olarak:
SELECT COUNT(*) FROM profiles;
-- 1 döndürmeli (sadece kendisi)
\`\`\`

## 🔄 Manuel Düzeltme

Eğer script çalışmazsa, manuel olarak:

\`\`\`sql
-- 1. Eski policy'leri sil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. Yeni policy ekle
CREATE POLICY "Users can view own profile, admins view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. RLS aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
\`\`\`

## 📝 Özet

| Sorun | Neden | Çözüm |
|-------|-------|-------|
| Kullanıcılar görünmüyor | RLS policy yok | `scripts/50-fix-profiles-rls-for-admin.sql` |
| Admin yetkisi çalışmıyor | `is_admin` false | `UPDATE profiles SET is_admin = true WHERE ...` |
| Hala boş | RLS kapalı | `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY` |

## 🔗 İlgili Dosyalar

- **Script:** `scripts/50-fix-profiles-rls-for-admin.sql`
- **Sayfa:** `app/admin/kullanicilar/page.tsx`
- **Admin Check:** `lib/admin-check.ts`

---

**TL;DR:** Profiles tablosunda RLS var ama admin için policy yok. `scripts/50-fix-profiles-rls-for-admin.sql` çalıştır, sorun çözülür! 🚀
