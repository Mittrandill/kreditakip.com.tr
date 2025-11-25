-- =====================================================
-- FIX REGISTRATION NAMES - Use Form Data
-- =====================================================
-- Purpose: Update handle_new_user to use first_name/last_name from registration form
-- Instead of parsing from email

-- =====================================================
-- DROP OLD FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =====================================================
-- CREATE UPDATED HANDLE_NEW_USER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  RAISE LOG 'handle_new_user: Processing user % (email: %)', NEW.id, NEW.email;

  -- Extract first_name directly from metadata (sent from registration form)
  v_first_name := NEW.raw_user_meta_data->>'first_name';

  -- Extract last_name directly from metadata
  v_last_name := NEW.raw_user_meta_data->>'last_name';

  -- Extract phone if provided
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- Fallback: If first_name is missing, try alternatives
  IF v_first_name IS NULL OR trim(v_first_name) = '' THEN
    -- Try 'name' field (Google OAuth might send this)
    v_first_name := NEW.raw_user_meta_data->>'name';

    -- If still empty, parse from email
    IF v_first_name IS NULL OR trim(v_first_name) = '' THEN
      v_first_name := split_part(NEW.email, '@', 1);
      v_last_name := NULL; -- Don't try to split email
    ELSE
      -- If 'name' field has space, split it
      IF position(' ' in v_first_name) > 0 THEN
        v_last_name := substring(v_first_name from position(' ' in v_first_name) + 1);
        v_first_name := split_part(v_first_name, ' ', 1);
      END IF;
    END IF;
  END IF;

  RAISE LOG 'handle_new_user: Parsed name - first: %, last: %, phone: %',
    v_first_name, v_last_name, v_phone;

  -- Create profile with registration form data
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    theme,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_phone,
    'light',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    updated_at = NOW();

  RAISE LOG 'handle_new_user: SUCCESS for user %', NEW.email;

  -- Triggers will automatically create:
  -- 1. notification_preferences (via create_default_notification_preferences_trigger)
  -- 2. usage_tracking (via on_user_created_initialize_free_tier)

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR for user % - % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Kullanıcı profili oluşturulamadı: %. Lütfen destek ekibiyle iletişime geçin.', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =====================================================
-- RECREATE TRIGGER (in case it was dropped)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'REGISTRATION NAME FIX APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger status: %', CASE WHEN v_trigger_count > 0 THEN '✓ ACTIVE' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'What changed:';
  RAISE NOTICE '- Now reads first_name directly from registration form';
  RAISE NOTICE '- Now reads last_name directly from registration form';
  RAISE NOTICE '- Now saves phone number if provided';
  RAISE NOTICE '- Fallback to email parsing if names are missing';
  RAISE NOTICE '';
  RAISE NOTICE 'Test: Register a new user and check if first/last name';
  RAISE NOTICE 'matches what was entered in the registration form.';
  RAISE NOTICE '========================================';
END $$;

-- Show trigger status
SELECT
  'TRIGGER STATUS' as check_type,
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE t.tgenabled WHEN 'O' THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';
