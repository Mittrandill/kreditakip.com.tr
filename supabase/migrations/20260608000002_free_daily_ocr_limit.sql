-- Daily OCR analysis cap for free/trial users (3/day). Paid plans unlimited.
-- Saved-credit limit (1 for free) is separate and unchanged.

CREATE TABLE IF NOT EXISTS ocr_daily_usage (
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE ocr_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own daily ocr usage" ON ocr_daily_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Check (does NOT increment) whether the user may run another OCR analysis today.
CREATE OR REPLACE FUNCTION public.check_daily_ocr_limit(p_user_id UUID)
 RETURNS JSONB
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_type TEXT;
  v_count INT := 0;
  v_limit INT := 3;
BEGIN
  SELECT plan_type INTO v_plan_type
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan_type IN ('pro', 'premium') THEN
    RETURN jsonb_build_object('allowed', true, 'unlimited', true);
  END IF;

  SELECT count INTO v_count
  FROM ocr_daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  v_count := COALESCE(v_count, 0);

  RETURN jsonb_build_object(
    'allowed', v_count < v_limit,
    'count', v_count,
    'limit', v_limit,
    'unlimited', false
  );
END;
$function$;

-- Increment today's counter (called only after a SUCCESSFUL analysis).
CREATE OR REPLACE FUNCTION public.increment_daily_ocr(p_user_id UUID)
 RETURNS VOID
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO ocr_daily_usage (user_id, usage_date, count, updated_at)
  VALUES (p_user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET count = ocr_daily_usage.count + 1, updated_at = NOW();
END;
$function$;
