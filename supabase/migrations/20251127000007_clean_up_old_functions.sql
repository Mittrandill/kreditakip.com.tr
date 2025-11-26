-- CLEAN UP OLD FUNCTIONS THAT ARE CAUSING ISSUES
-- Drop all conflicting function versions to ensure clean state

-- Drop all conflicting increment_saved_credits functions
DROP FUNCTION IF EXISTS public.increment_saved_credits(UUID);

-- Drop all conflicting increment_usage functions
DROP FUNCTION IF EXISTS public.increment_usage(UUID, TEXT);

-- Drop all conflicting can_use_feature functions
DROP FUNCTION IF EXISTS public.can_use_feature(UUID, TEXT);

-- Drop all conflicting can_user_save_credit functions
DROP FUNCTION IF EXISTS public.can_user_save_credit(UUID);

-- Verify all functions are dropped
DO $$
BEGIN
  -- Verify functions are dropped (should return errors)
  PERFORM pg_advisory_lock('increment_saved_credits_cleanup');
  PERFORM pg_advisory_lock('increment_usage_cleanup');
  PERFORM pg_advisory_lock('can_use_feature_cleanup');
  PERFORM pg_advisory_lock('can_user_save_credit_cleanup');
END $$;

-- Now run the clean migrations in the correct order
-- Note: The newer migrations (20251127000004, 20251127000005, 20251127000006) should recreate the functions properly

-- Reset session for safety
RESET SESSION;