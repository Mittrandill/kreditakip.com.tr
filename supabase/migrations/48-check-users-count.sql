-- Kullanıcı sayılarını kontrol etme script'i

-- 1. Auth.users tablosundaki toplam kullanıcı sayısı
SELECT
  'auth.users' as tablo,
  COUNT(*) as toplam_kullanici
FROM auth.users;

-- 2. Profiles tablosundaki toplam kullanıcı sayısı
SELECT
  'profiles' as tablo,
  COUNT(*) as toplam_kullanici
FROM public.profiles;

-- 3. Auth.users'da olup profiles'da olmayan kullanıcılar
SELECT
  'Profiles da eksik' as durum,
  COUNT(*) as sayi
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Profiles'da olup auth.users'da olmayan kayıtlar (olmamalı)
SELECT
  'Auth da eksik' as durum,
  COUNT(*) as sayi
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- 5. Detaylı karşılaştırma
SELECT
  au.id,
  au.email as auth_email,
  au.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.is_admin,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 20;

-- 6. Admin kullanıcılar
SELECT
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM public.profiles
WHERE is_admin = true;
