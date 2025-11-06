-- Migration: Auto-create notification_preferences for new users
-- Bu migration yeni kullanıcılar için otomatik bildirim tercihleri oluşturur

-- 1. Function: Yeni kullanıcı oluşturulduğunda notification_preferences ekle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Yeni kullanıcı için default notification preferences oluştur
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
    notification_time
  ) VALUES (
    NEW.id,
    true,  -- email_3_days_before
    true,  -- email_1_day_before
    true,  -- email_on_due_date
    true,  -- email_overdue
    false, -- sms_1_day_before (SMS henüz aktif değil)
    false, -- sms_on_due_date (SMS henüz aktif değil)
    true,  -- email_enabled
    false, -- sms_enabled (SMS henüz aktif değil)
    '09:00:00' -- notification_time (sabah 9)
  )
  ON CONFLICT (user_id) DO NOTHING; -- Eğer zaten varsa, hata verme

  RETURN NEW;
END;
$$;

-- 2. Trigger: auth.users tablosuna INSERT olduğunda çalış
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Mevcut kullanıcılar için notification_preferences oluştur (eğer yoksa)
-- Bu bir kerelik operation, trigger bundan sonraki kullanıcılar için otomatik çalışacak
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
  notification_time
)
SELECT
  au.id,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  false,
  '09:00:00'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.notification_preferences np
  WHERE np.user_id = au.id
);

-- 4. Verify: Kaç kullanıcı için preferences oluşturuldu kontrol et
DO $$
DECLARE
  user_count INTEGER;
  pref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO pref_count FROM public.notification_preferences;

  RAISE NOTICE '✅ Migration completed!';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Total notification preferences: %', pref_count;

  IF user_count > pref_count THEN
    RAISE WARNING '⚠️  Some users are missing notification preferences! Please check.';
  END IF;
END $$;
