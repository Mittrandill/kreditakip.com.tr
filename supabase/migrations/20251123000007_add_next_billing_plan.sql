-- =====================================================
-- ADD NEXT_BILLING_PLAN COLUMN TO SUBSCRIPTIONS
-- Priority: P1 - Required for plan change functionality
-- =====================================================

-- Migration: Add next_billing_plan column to subscriptions table
-- Created: 2025-11-23
-- Description: Allows users to schedule plan changes for next billing cycle

BEGIN;

-- Add next_billing_plan column to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS next_billing_plan TEXT;

-- Add comment
COMMENT ON COLUMN subscriptions.next_billing_plan IS 'Scheduled plan for next billing cycle (monthly/yearly)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_plan
ON subscriptions(next_billing_plan)
WHERE next_billing_plan IS NOT NULL;

COMMIT;

-- =====================================================
-- NOTES
-- =====================================================

-- This column allows users to:
-- 1. Schedule plan changes without immediate effect
-- 2. Switch from monthly to yearly (or vice versa) at next renewal
-- 3. Maintain current subscription until expiry

-- Example values:
-- - 'monthly': Switch to monthly plan at next billing
-- - 'yearly': Switch to yearly plan at next billing
-- - NULL: No plan change scheduled

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS next_billing_plan;
-- DROP INDEX IF EXISTS idx_subscriptions_next_billing_plan;
