-- ============================================================================
-- SECURITY FIX: lock down update_usage_limits_for_subscription
-- Date: 2026-06-06
--
-- This SECURITY DEFINER function takes an arbitrary (p_user_id, p_plan_type)
-- and writes usage limits with NO admin/auth.uid() check. It was exposed to
-- anon/authenticated, so any user could call it to raise their own limits to
-- premium (same class as the subscription_usage write fix). It is not called
-- anywhere in the application code -> revoke from public roles entirely.
-- Also pins the previously-mutable search_path.
-- ============================================================================

REVOKE ALL ON FUNCTION public.update_usage_limits_for_subscription(uuid, text)
  FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.update_usage_limits_for_subscription(uuid, text)
  SET search_path = '';
