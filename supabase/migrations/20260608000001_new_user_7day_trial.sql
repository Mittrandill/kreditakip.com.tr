-- Give new users a real 7-day trial by seeding trial usage limits at signup.
-- Trial: OCR unlimited analysis + 2 saved credits, 1 risk analysis, reset in 7 days.
-- The status API presents this as "trialing" for 7 days then downgrades usage to
-- free tier (1 saved credit, 0 risk analysis).

CREATE OR REPLACE FUNCTION public.initialize_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO public.notification_preferences (
    user_id, email_3_days_before, email_1_day_before, email_on_due_date,
    email_overdue, sms_1_day_before, sms_on_due_date, email_enabled,
    sms_enabled, notification_time
  ) VALUES (
    NEW.id, true, true, true, true, false, false, true, false, '09:00:00'
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_subscription_id
  FROM public.subscriptions
  WHERE user_id = NEW.id AND status = 'active' AND deleted_at IS NULL
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    INSERT INTO public.subscriptions (
      user_id, plan_type, plan_id, status, start_date, expires_at
    ) VALUES (
      NEW.id, 'free', 'free', 'active', NOW(), '2099-12-31'::timestamp
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_subscription_id;
  END IF;

  -- TRIAL: OCR analysis unlimited, 2 saved credits, reset in 7 days
  INSERT INTO public.subscription_usage (
    user_id, subscription_id, feature_type, usage_count, limit_count,
    saved_credits_count, saved_credits_limit, reset_at
  ) VALUES (
    NEW.id, v_subscription_id, 'ocr_analysis', 0, 999999, 0, 2,
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id, feature_type) DO UPDATE SET
    subscription_id = EXCLUDED.subscription_id,
    limit_count = EXCLUDED.limit_count,
    saved_credits_limit = EXCLUDED.saved_credits_limit,
    reset_at = EXCLUDED.reset_at,
    updated_at = NOW();

  -- TRIAL: 1 risk analysis, reset in 7 days
  INSERT INTO public.subscription_usage (
    user_id, subscription_id, feature_type, usage_count, limit_count,
    saved_credits_count, saved_credits_limit, reset_at
  ) VALUES (
    NEW.id, v_subscription_id, 'risk_analysis', 0, 1, 0, 0,
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id, feature_type) DO UPDATE SET
    subscription_id = EXCLUDED.subscription_id,
    limit_count = EXCLUDED.limit_count,
    saved_credits_limit = EXCLUDED.saved_credits_limit,
    reset_at = EXCLUDED.reset_at,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;
