-- =====================================================
-- MINIMAL AUTH FIX - Sadece Kayıt Sorununu Çöz
-- =====================================================
-- Bu script sadece user registration trigger'ını düzeltir
-- Mevcut tablo yapısını BOZMAZ, sadece eksik trigger'ı ekler
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Temizlik - Eski trigger ve function'ları kaldır
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- =====================================================
-- 2. Yeni handle_new_user Function - MEVCUT YAPIYLA UYUMLU
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Log başlangıç
  RAISE LOG 'handle_new_user: Starting for user % (email: %)', NEW.id, NEW.email;

  -- İsim parse et
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- İsmi böl
  IF position(' ' in v_full_name) > 0 THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  ELSE
    v_first_name := v_full_name;
    v_last_name := NULL;
  END IF;

  -- Profile oluştur - SADECE MEVCUT KOLONLARLA
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RAISE LOG 'handle_new_user: Profile created for user %', NEW.email;

  -- Notification preferences oluştur - MEVCUT YAPIYLA
  INSERT INTO public.notification_preferences (
    user_id,
    email_3_days_before,
    email_1_day_before,
    email_on_due_date,
    email_overdue,
    sms_1_day_before,
    sms_on_due_date,
    email_enabled,
    sms_enabled,
    notification_time,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,   -- email_3_days_before
    true,   -- email_1_day_before
    true,   -- email_on_due_date
    true,   -- email_overdue
    false,  -- sms_1_day_before
    false,  -- sms_on_due_date
    true,   -- email_enabled
    false,  -- sms_enabled
    '09:00:00'::time,  -- notification_time
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'handle_new_user: Notification preferences created for user %', NEW.email;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Detaylı hata logu
    RAISE LOG 'handle_new_user ERROR for user % (email: %): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;

    -- Hatayı kullanıcıya göster
    RAISE EXCEPTION 'Profil oluşturulamadı: %. Lütfen destek ile iletişime geçin.', SQLERRM;
END;
$$;

-- Yetki ver
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- 3. Auth Trigger Oluştur
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. Mevcut Kullanıcıları Düzelt (Profili Olmayanlar)
-- =====================================================

-- Profili olmayan kullanıcılar için profile oluştur
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))) > 0
    THEN split_part(COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)), ' ', 1)
    ELSE COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
  END as first_name,
  CASE
    WHEN position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))) > 0
    THEN substring(COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) from position(' ' in COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))) + 1)
    ELSE NULL
  END as last_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Notification preferences olmayan kullanıcılar için oluştur
INSERT INTO public.notification_preferences (
  user_id,
  email_3_days_before,
  email_1_day_before,
  email_on_due_date,
  email_overdue,
  sms_1_day_before,
  sms_on_due_date,
  email_enabled,
  sms_enabled,
  notification_time,
  created_at,
  updated_at
)
SELECT
  p.id,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  false,
  '09:00:00'::time,
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.notification_preferences np ON np.user_id = p.id
WHERE np.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 5. Verification
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
  v_users_count INTEGER;
  v_profiles_count INTEGER;
  v_missing INTEGER;
BEGIN
  -- Trigger kontrolü
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

  -- Kullanıcı sayıları
  SELECT COUNT(*) INTO v_users_count FROM auth.users;
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;

  -- Eksik profiller
  SELECT COUNT(*) INTO v_missing
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MINIMAL AUTH FIX - VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Trigger oluşturuldu: %', CASE WHEN v_trigger_count > 0 THEN 'EVET' ELSE 'HAYIR' END;
  RAISE NOTICE '✓ Toplam kullanıcı: %', v_users_count;
  RAISE NOTICE '✓ Toplam profil: %', v_profiles_count;
  RAISE NOTICE '✓ Eksik profil: %', v_missing;
  RAISE NOTICE '========================================';

  IF v_trigger_count > 0 AND v_missing = 0 THEN
    RAISE NOTICE '✓✓✓ BAŞARILI! Kayıt sistemi çalışıyor! ✓✓✓';
  ELSE
    RAISE WARNING 'Bazı sorunlar var, kontrol edin!';
  END IF;
END $$;

-- Son kontrol sorguları
SELECT
  'TRIGGER STATUS' as info,
  t.tgname as trigger_name,
  CASE t.tgenabled WHEN 'O' THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

SELECT
  'USER vs PROFILE COUNT' as info,
  (SELECT COUNT(*) FROM auth.users) as users,
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id WHERE p.id IS NULL) as missing;
