-- Admin kullanıcı oluşturma script'i
-- Bu script'i çalıştırmadan önce, admin yapmak istediğiniz kullanıcı ile
-- normal kayıt işlemini tamamlayın (/kayit-ol)

-- KULLANIM:
-- 1. Aşağıdaki email adresini kendi email adresiniz ile değiştirin
-- 2. Supabase Dashboard > SQL Editor'de çalıştırın

-- Email ile admin yetkisi verme:
UPDATE public.profiles
SET is_admin = true
WHERE email = 'BURAYA_EMAIL_YAZIN@kreditakip.com.tr';

-- VEYA User ID ile admin yetkisi verme:
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE id = 'BURAYA_USER_ID_YAZIN';

-- Admin kullanıcıları kontrol etme:
SELECT
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM public.profiles
WHERE is_admin = true;

-- Eğer hiç admin kullanıcı yoksa, sonuç boş dönecektir.
-- Bu durumda yukarıdaki UPDATE komutunu çalıştırın.
