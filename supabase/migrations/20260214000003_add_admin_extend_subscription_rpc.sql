-- RPC function for atomic subscription extension
-- Handles: extend expiry date, reactivate if expired, log admin action
-- All operations are atomic (transaction) - if any step fails, all changes are rolled back

CREATE OR REPLACE FUNCTION admin_extend_subscription(
  p_subscription_id uuid,
  p_expires_at timestamptz,
  p_user_id uuid,
  p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_extended_subscription record;
BEGIN
  -- 1. Update expires_at and reactivate if needed
  UPDATE public.subscriptions
  SET
    expires_at = p_expires_at,
    status = 'active', -- Reactivate if expired
    updated_at = now()
  WHERE
    id = p_subscription_id
  RETURNING * INTO v_extended_subscription;

  -- Check if subscription exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  -- 2. Log admin action (if admin_id provided)
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_action_logs (
      admin_id, action_type, target_type, target_id, target_user_id,
      description, metadata
    )
    VALUES (
      p_admin_id, 'subscription_extend', 'subscription', p_subscription_id, p_user_id,
      'Abonelik süresi ' || to_char(p_expires_at, 'DD.MM.YYYY') || ' tarihine uzatıldı',
      jsonb_build_object('expiresAt', p_expires_at)
    );
  END IF;

  -- Return extended subscription details
  RETURN jsonb_build_object(
    'id', v_extended_subscription.id,
    'user_id', v_extended_subscription.user_id,
    'plan_id', v_extended_subscription.plan_id,
    'plan_type', v_extended_subscription.plan_type,
    'status', v_extended_subscription.status,
    'expires_at', v_extended_subscription.expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Roll back automatically (PostgreSQL function behavior)
    RAISE EXCEPTION 'Subscription extension failed: %', SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION admin_extend_subscription IS 'Atomically extend subscription expiry date and reactivate if expired. All operations rollback on failure.';
