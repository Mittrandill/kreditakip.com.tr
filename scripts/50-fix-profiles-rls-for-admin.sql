-- Profiles tablosu RLS politikalarını admin kullanıcılar için düzelt

-- 1. Mevcut SELECT politikalarını kontrol et
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. Admin kullanıcıların tüm profilleri görebilmesi için policy ekle/güncelle

-- Önce var olan "Users can view their own profile" policy'sini DROP et (eğer varsa)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Yeni policy: Kullanıcılar kendi profilini VE adminler tüm profilleri görebilir
CREATE POLICY "Users can view own profile, admins view all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id  -- Kullanıcı kendi profilini görebilir
    OR
    EXISTS (         -- VEYA admin ise tüm profilleri görebilir
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. UPDATE policy'si de ekle (adminler tüm profilleri güncelleyebilir)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile, admins update all"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. INSERT policy (eğer trigger yoksa manual ekleme için)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 5. DELETE policy (sadece adminler silebilir)
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6. RLS'in aktif olduğundan emin ol
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Kontrol: Tüm policies'i göster
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
