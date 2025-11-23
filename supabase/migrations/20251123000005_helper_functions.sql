-- =====================================================
-- HELPER FUNCTIONS & STORED PROCEDURES
-- Priority: P1 - Optimize Common Operations
-- =====================================================

-- Migration: Add database functions to optimize common queries
-- Created: 2025-11-23
-- Description: Reduces N+1 queries and improves performance
--              by moving complex logic to database functions

BEGIN;

-- =====================================================
-- 1. USER DASHBOARD SUMMARY
-- =====================================================

-- Get complete user dashboard data in a single query
CREATE OR REPLACE FUNCTION get_user_dashboard_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_credits', COUNT(DISTINCT c.id),
    'active_credits', COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active'),
    'overdue_credits', COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'overdue'),
    'total_debt', COALESCE(SUM(c.remaining_debt), 0),
    'monthly_payment', COALESCE(SUM(c.monthly_payment), 0),
    'avg_interest_rate', ROUND(AVG(c.interest_rate), 2),
    'payment_progress', ROUND(AVG(c.payment_progress), 2),
    'upcoming_payments_7_days', (
      SELECT COUNT(*)
      FROM payment_plans pp
      WHERE pp.credit_id IN (SELECT id FROM credits WHERE user_id = p_user_id)
        AND pp.status = 'pending'
        AND pp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    ),
    'upcoming_payments_30_days', (
      SELECT COUNT(*)
      FROM payment_plans pp
      WHERE pp.credit_id IN (SELECT id FROM credits WHERE user_id = p_user_id)
        AND pp.status = 'pending'
        AND pp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    ),
    'unread_notifications', (
      SELECT COUNT(*)
      FROM notifications n
      WHERE n.user_id = p_user_id
        AND n.is_read = false
        AND n.deleted_at IS NULL
    )
  ) INTO v_result
  FROM credits c
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 2. CREDIT DETAILS WITH RELATIONSHIPS
-- =====================================================

-- Get credit with all related data (bank, type, payment plans)
CREATE OR REPLACE FUNCTION get_credit_details(p_credit_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM credits
    WHERE id = p_credit_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('error', 'Credit not found or access denied');
  END IF;

  SELECT json_build_object(
    'credit', row_to_json(c.*),
    'bank', row_to_json(b.*),
    'credit_type', row_to_json(ct.*),
    'payment_plans', (
      SELECT json_agg(row_to_json(pp.*) ORDER BY pp.installment_number)
      FROM payment_plans pp
      WHERE pp.credit_id = p_credit_id
    ),
    'payment_history', (
      SELECT json_agg(row_to_json(ph.*) ORDER BY ph.payment_date DESC)
      FROM payment_history ph
      WHERE ph.credit_id = p_credit_id
    ),
    'statistics', json_build_object(
      'total_paid', (
        SELECT COALESCE(SUM(total_payment), 0)
        FROM payment_plans
        WHERE credit_id = p_credit_id AND status = 'paid'
      ),
      'total_remaining', (
        SELECT COALESCE(SUM(total_payment), 0)
        FROM payment_plans
        WHERE credit_id = p_credit_id AND status = 'pending'
      ),
      'next_payment_date', (
        SELECT MIN(due_date)
        FROM payment_plans
        WHERE credit_id = p_credit_id AND status = 'pending'
      ),
      'last_payment_date', (
        SELECT MAX(payment_date)
        FROM payment_history
        WHERE credit_id = p_credit_id
      )
    )
  ) INTO v_result
  FROM credits c
  LEFT JOIN banks b ON b.id = c.bank_id
  LEFT JOIN credit_types ct ON ct.id = c.credit_type_id
  WHERE c.id = p_credit_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 3. UPCOMING PAYMENTS SUMMARY
-- =====================================================

-- Get upcoming payments grouped by date
CREATE OR REPLACE FUNCTION get_upcoming_payments(
  p_user_id UUID,
  p_days_ahead INT DEFAULT 30
)
RETURNS TABLE (
  payment_date DATE,
  total_amount NUMERIC,
  payment_count INT,
  payments JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.due_date as payment_date,
    SUM(pp.total_payment) as total_amount,
    COUNT(*)::INT as payment_count,
    json_agg(
      json_build_object(
        'id', pp.id,
        'credit_id', pp.credit_id,
        'installment_number', pp.installment_number,
        'amount', pp.total_payment,
        'bank_name', b.name,
        'bank_logo', b.logo_url,
        'credit_code', c.credit_code
      ) ORDER BY pp.total_payment DESC
    ) as payments
  FROM payment_plans pp
  JOIN credits c ON c.id = pp.credit_id
  JOIN banks b ON b.id = c.bank_id
  WHERE c.user_id = p_user_id
    AND pp.status = 'pending'
    AND pp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    AND c.deleted_at IS NULL
  GROUP BY pp.due_date
  ORDER BY pp.due_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 4. BANK DEBT BREAKDOWN
-- =====================================================

-- Get debt breakdown by bank (for charts)
CREATE OR REPLACE FUNCTION get_bank_debt_breakdown(p_user_id UUID)
RETURNS TABLE (
  bank_id UUID,
  bank_name TEXT,
  bank_logo TEXT,
  total_debt NUMERIC,
  monthly_payment NUMERIC,
  credit_count INT,
  avg_interest_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id as bank_id,
    b.name as bank_name,
    b.logo_url as bank_logo,
    SUM(c.remaining_debt) as total_debt,
    SUM(c.monthly_payment) as monthly_payment,
    COUNT(c.id)::INT as credit_count,
    ROUND(AVG(c.interest_rate), 2) as avg_interest_rate
  FROM credits c
  JOIN banks b ON b.id = c.bank_id
  WHERE c.user_id = p_user_id
    AND c.status IN ('active', 'overdue')
    AND c.deleted_at IS NULL
  GROUP BY b.id, b.name, b.logo_url
  HAVING SUM(c.remaining_debt) > 0
  ORDER BY total_debt DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 5. PAYMENT REMINDERS BATCH CREATE
-- =====================================================

-- Create payment reminders for all users (cron job)
CREATE OR REPLACE FUNCTION create_payment_reminders_batch()
RETURNS JSON AS $$
DECLARE
  v_notifications_created INT := 0;
  v_users_notified INT := 0;
  v_user RECORD;
  v_payment RECORD;
  v_notification_ids UUID[];
BEGIN
  -- For each user with upcoming payments
  FOR v_user IN
    SELECT DISTINCT c.user_id
    FROM credits c
    JOIN payment_plans pp ON pp.credit_id = c.id
    WHERE pp.status = 'pending'
      AND pp.due_date IN (
        CURRENT_DATE + INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '1 day',
        CURRENT_DATE
      )
      AND c.deleted_at IS NULL
  LOOP
    -- Check notification preferences
    DECLARE
      v_prefs RECORD;
    BEGIN
      SELECT * INTO v_prefs
      FROM notification_preferences
      WHERE user_id = v_user.user_id;

      -- Skip if notifications disabled
      IF v_prefs IS NULL OR v_prefs.email_enabled = false THEN
        CONTINUE;
      END IF;
    END;

    -- Create notifications for upcoming payments
    FOR v_payment IN
      SELECT
        pp.*,
        c.credit_code,
        b.name as bank_name,
        (pp.due_date - CURRENT_DATE) as days_until_due
      FROM payment_plans pp
      JOIN credits c ON c.id = pp.credit_id
      JOIN banks b ON b.id = c.bank_id
      WHERE c.user_id = v_user.user_id
        AND pp.status = 'pending'
        AND pp.due_date IN (
          CURRENT_DATE + INTERVAL '3 days',
          CURRENT_DATE + INTERVAL '1 day',
          CURRENT_DATE
        )
        -- Don't create duplicate notifications
        AND NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE payment_plan_id = pp.id
            AND created_at > CURRENT_DATE - INTERVAL '1 day'
        )
    LOOP
      DECLARE
        v_notification_id UUID;
        v_title TEXT;
        v_message TEXT;
        v_type TEXT;
      BEGIN
        -- Determine notification type based on days until due
        CASE v_payment.days_until_due
          WHEN 3 THEN
            v_title := 'Ödeme Hatırlatması - 3 Gün Kaldı';
            v_type := 'info';
          WHEN 1 THEN
            v_title := 'Ödeme Hatırlatması - Yarın Vade';
            v_type := 'warning';
          WHEN 0 THEN
            v_title := 'Ödeme Hatırlatması - Bugün Vade';
            v_type := 'error';
          ELSE
            v_title := 'Ödeme Hatırlatması';
            v_type := 'info';
        END CASE;

        v_message := format(
          '%s bankasından %s. taksit ödemenizin vadesi %s. Tutar: %s ₺',
          v_payment.bank_name,
          v_payment.installment_number,
          CASE v_payment.days_until_due
            WHEN 3 THEN '3 gün sonra'
            WHEN 1 THEN 'yarın'
            WHEN 0 THEN 'bugün'
            ELSE v_payment.due_date::TEXT
          END,
          to_char(v_payment.total_payment, 'FM999,999,999.00')
        );

        -- Insert notification
        INSERT INTO notifications (
          user_id,
          credit_id,
          payment_plan_id,
          title,
          message,
          type,
          notification_type,
          is_read
        ) VALUES (
          v_user.user_id,
          v_payment.credit_id,
          v_payment.id,
          v_title,
          v_message,
          v_type,
          'app_reminder',
          false
        ) RETURNING id INTO v_notification_id;

        v_notification_ids := array_append(v_notification_ids, v_notification_id);
        v_notifications_created := v_notifications_created + 1;
      END;
    END LOOP;

    IF array_length(v_notification_ids, 1) > 0 THEN
      v_users_notified := v_users_notified + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'notifications_created', v_notifications_created,
    'users_notified', v_users_notified,
    'created_at', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 6. FINANCIAL HEALTH METRICS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_financial_health_metrics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_credits RECORD;
  v_metrics JSON;
BEGIN
  -- Get financial profile
  SELECT * INTO v_profile
  FROM financial_profiles
  WHERE user_id = p_user_id;

  -- Get credit statistics
  SELECT
    COUNT(*) as total_credits,
    SUM(remaining_debt) as total_debt,
    SUM(monthly_payment) as total_monthly_payment,
    AVG(interest_rate) as avg_interest_rate
  INTO v_credits
  FROM credits
  WHERE user_id = p_user_id
    AND status IN ('active', 'overdue')
    AND deleted_at IS NULL;

  -- Calculate metrics
  v_metrics := json_build_object(
    'debt_to_income_ratio', CASE
      WHEN v_profile.monthly_income > 0
      THEN ROUND((v_credits.total_monthly_payment / v_profile.monthly_income) * 100, 2)
      ELSE NULL
    END,
    'disposable_income',
      v_profile.monthly_income - v_profile.monthly_expenses - COALESCE(v_credits.total_monthly_payment, 0),
    'savings_rate', CASE
      WHEN v_profile.monthly_income > 0
      THEN ROUND(((v_profile.monthly_income - v_profile.monthly_expenses - COALESCE(v_credits.total_monthly_payment, 0)) / v_profile.monthly_income) * 100, 2)
      ELSE NULL
    END,
    'net_worth',
      COALESCE(v_profile.total_assets, 0) - COALESCE(v_profile.total_liabilities, 0),
    'emergency_fund_months', CASE
      WHEN v_profile.monthly_expenses > 0 AND v_profile.emergency_fund > 0
      THEN ROUND(v_profile.emergency_fund / v_profile.monthly_expenses, 1)
      ELSE 0
    END,
    'total_credits', COALESCE(v_credits.total_credits, 0),
    'total_debt', COALESCE(v_credits.total_debt, 0),
    'avg_interest_rate', COALESCE(v_credits.avg_interest_rate, 0),
    'monthly_income', COALESCE(v_profile.monthly_income, 0),
    'monthly_expenses', COALESCE(v_profile.monthly_expenses, 0)
  );

  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 7. USAGE TRACKING HELPERS
-- =====================================================

-- Check if user can use a premium feature
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
BEGIN
  -- Check if user has premium subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type = 'premium'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- Premium users have unlimited access
  IF v_subscription.id IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Check usage limits for free users
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND reset_at > NOW()
  LIMIT 1;

  -- No usage record = can use (will be created)
  IF v_usage.id IS NULL THEN
    RETURN true;
  END IF;

  -- Check if under limit
  RETURN v_usage.used_count < v_usage.limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INT;
BEGIN
  -- Set limits based on feature type
  v_limit := CASE p_feature_type
    WHEN 'ocr_analysis' THEN 3
    WHEN 'risk_analysis' THEN 3
    ELSE 5
  END;

  -- Insert or update usage
  INSERT INTO usage_tracking (user_id, feature_type, used_count, limit_count, reset_at)
  VALUES (
    p_user_id,
    p_feature_type,
    1,
    v_limit,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (id)
  DO UPDATE SET
    used_count = usage_tracking.used_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 8. CLEANUP FUNCTIONS
-- =====================================================

-- Delete old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS JSON AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_read = true;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted,
    'deleted_at', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Cleanup expired pending subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_pending_subscriptions()
RETURNS JSON AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM pending_subscriptions
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND status = 'pending';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted,
    'deleted_at', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMIT;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

-- Grant execute to authenticated users for read functions
GRANT EXECUTE ON FUNCTION get_user_dashboard_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_details(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_payments(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_debt_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_financial_health_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_feature(UUID, TEXT) TO authenticated;

-- Service role only functions
GRANT EXECUTE ON FUNCTION create_payment_reminders_batch() TO service_role;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_pending_subscriptions() TO service_role;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get dashboard summary
-- SELECT get_user_dashboard_summary('user-uuid-here');

-- Get credit details
-- SELECT get_credit_details('credit-uuid', 'user-uuid');

-- Get upcoming payments (next 30 days)
-- SELECT * FROM get_upcoming_payments('user-uuid', 30);

-- Get bank debt breakdown
-- SELECT * FROM get_bank_debt_breakdown('user-uuid');

-- Calculate financial health
-- SELECT calculate_financial_health_metrics('user-uuid');

-- Check feature access
-- SELECT can_use_feature('user-uuid', 'risk_analysis');

-- Create payment reminders (cron job)
-- SELECT create_payment_reminders_batch();

-- Cleanup (cron job)
-- SELECT cleanup_old_notifications();
-- SELECT cleanup_expired_pending_subscriptions();
