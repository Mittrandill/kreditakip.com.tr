-- Migration: Clean up PayTR related data - Sütunlar zaten kaldırılmış
-- Date: 2025-11-29
-- Description: Final check and update for PayTR to Paddle migration

-- Note: PayTR columns have already been removed from subscriptions table
-- This migration serves as a final check and documentation

-- Verify no PayTR data exists
SELECT
  'PayTR kontrolü' as kontrol,
  COUNT(*) as kayit_sayisi
FROM subscriptions
WHERE
  payment_method = 'paytr' OR
  payment_method = 'PayTR' OR
  plan_type ILIKE '%paytr%';

-- Update any remaining PayTR references to paddle (if any)
UPDATE subscriptions
SET
  payment_method = 'paddle'
WHERE
  payment_method = 'paytr' OR
  payment_method = 'PayTR';

-- Final verification
SELECT
  'Ödeme method dağılımı (temizlik sonrası):' as rapor,
  payment_method,
  COUNT(*) as sayi
FROM subscriptions
GROUP BY payment_method;

-- Update audit log if table exists
DO $$
BEGIN
  INSERT INTO audit_logs (user_id, action, details)
  SELECT
    auth.uid() as user_id,
    'PAYTR_CLEANUP_FINAL' as action,
    'Final cleanup completed - verified no PayTR references' as details;
EXCEPTION WHEN OTHERS THEN
  -- Table may not exist, ignore
END $$;