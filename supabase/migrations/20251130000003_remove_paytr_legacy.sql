-- Migration: Remove PayTR Legacy Code from Database
-- Purpose: Complete migration from PayTR to Paddle by removing legacy tables and columns
-- This is part of the full PayTR cleanup strategy

-- =============================================================================
-- Background
-- =============================================================================
-- The application previously used PayTR for payment processing.
-- Now fully migrated to Paddle. This migration removes all PayTR-specific:
-- - Tables (pending_renewal_payments, pending_subscriptions)
-- - Columns (paytr_order_id, paytr_conversation_id, etc.)
-- - Legacy payment provider references
--
-- Safety: All PayTR tables will be backed up before deletion

-- =============================================================================
-- Step 1: Backup PayTR tables before deletion
-- =============================================================================

-- Backup pending_renewal_payments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_renewal_payments') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pending_renewal_payments_backup AS SELECT * FROM pending_renewal_payments';
    RAISE NOTICE 'Backed up pending_renewal_payments table';
  ELSE
    RAISE NOTICE 'pending_renewal_payments table does not exist, skipping backup';
  END IF;
END $$;

-- Backup pending_subscriptions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_subscriptions') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pending_subscriptions_backup AS SELECT * FROM pending_subscriptions';
    RAISE NOTICE 'Backed up pending_subscriptions table';
  ELSE
    RAISE NOTICE 'pending_subscriptions table does not exist, skipping backup';
  END IF;
END $$;

-- =============================================================================
-- Step 2: Drop PayTR-specific tables
-- =============================================================================

-- Drop pending_renewal_payments (PayTR renewal payments)
DROP TABLE IF EXISTS pending_renewal_payments CASCADE;

-- Add comment to backup table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_renewal_payments_backup') THEN
    EXECUTE format(
      'COMMENT ON TABLE pending_renewal_payments_backup IS %L',
      'Backup of pending_renewal_payments table before PayTR removal on ' || now()::date || '. This table tracked PayTR renewal payment URLs.'
    );
  END IF;
END $$;

-- Drop pending_subscriptions (PayTR subscription initialization)
DROP TABLE IF EXISTS pending_subscriptions CASCADE;

-- Add comment to backup table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_subscriptions_backup') THEN
    EXECUTE format(
      'COMMENT ON TABLE pending_subscriptions_backup IS %L',
      'Backup of pending_subscriptions table before PayTR removal on ' || now()::date || '. This table tracked pending PayTR subscription purchases.'
    );
  END IF;
END $$;

-- Log deletions
DO $$
BEGIN
  RAISE NOTICE 'Dropped PayTR tables:';
  RAISE NOTICE '  - pending_renewal_payments (backup: pending_renewal_payments_backup)';
  RAISE NOTICE '  - pending_subscriptions (backup: pending_subscriptions_backup)';
END $$;

-- =============================================================================
-- Step 3: Remove PayTR columns from payment_transactions
-- =============================================================================

-- Check if PayTR columns exist before dropping
DO $$
DECLARE
  has_paytr_order_id BOOLEAN;
  has_paytr_conversation_id BOOLEAN;
  records_with_paytr INTEGER := 0;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'paytr_order_id'
  ) INTO has_paytr_order_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'paytr_conversation_id'
  ) INTO has_paytr_conversation_id;

  -- Count records with PayTR data (for logging)
  IF has_paytr_order_id THEN
    SELECT COUNT(*) INTO records_with_paytr
    FROM payment_transactions
    WHERE paytr_order_id IS NOT NULL OR paytr_conversation_id IS NOT NULL;

    RAISE NOTICE 'Found % payment_transactions records with PayTR data', records_with_paytr;
  END IF;

  -- Drop columns
  IF has_paytr_order_id THEN
    ALTER TABLE payment_transactions DROP COLUMN paytr_order_id;
    RAISE NOTICE 'Dropped column: payment_transactions.paytr_order_id';
  END IF;

  IF has_paytr_conversation_id THEN
    ALTER TABLE payment_transactions DROP COLUMN paytr_conversation_id;
    RAISE NOTICE 'Dropped column: payment_transactions.paytr_conversation_id';
  END IF;
END $$;

-- =============================================================================
-- Step 4: Update payment_provider to Paddle
-- =============================================================================

-- Update payment_transactions
UPDATE payment_transactions
SET payment_provider = 'paddle'
WHERE payment_provider IS NULL
   OR payment_provider = 'paytr'
   OR payment_provider = '';

-- Log update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % payment_transactions records to payment_provider = ''paddle''', updated_count;
END $$;

-- Update invoices
UPDATE invoices
SET payment_provider = 'paddle'
WHERE payment_provider IS NULL
   OR payment_provider = 'paytr'
   OR payment_provider = '';

-- Log update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % invoices records to payment_provider = ''paddle''', updated_count;
END $$;

-- =============================================================================
-- Step 5: Clean up PayTR metadata from subscription_plans
-- =============================================================================

-- Remove paytr_product_id from metadata JSON
UPDATE subscription_plans
SET metadata = metadata - 'paytr_product_id'
WHERE metadata ? 'paytr_product_id';

-- Log cleanup
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Removed paytr_product_id from % subscription_plans records', updated_count;
END $$;

-- =============================================================================
-- Step 6: Add comment to payment_provider columns
-- =============================================================================

DO $$
BEGIN
  EXECUTE format(
    'COMMENT ON COLUMN payment_transactions.payment_provider IS %L',
    'Payment provider used for this transaction. Always ''paddle'' after PayTR migration (' || now()::date || ').'
  );

  EXECUTE format(
    'COMMENT ON COLUMN invoices.payment_provider IS %L',
    'Payment provider used for this invoice. Always ''paddle'' after PayTR migration (' || now()::date || ').'
  );
END $$;

-- =============================================================================
-- Step 7: Verify no PayTR references remain
-- =============================================================================

DO $$
DECLARE
  paytr_count INTEGER;
BEGIN
  -- Check payment_transactions
  SELECT COUNT(*) INTO paytr_count
  FROM payment_transactions
  WHERE payment_provider = 'paytr';

  IF paytr_count > 0 THEN
    RAISE WARNING 'Found % payment_transactions with payment_provider = ''paytr''', paytr_count;
  ELSE
    RAISE NOTICE 'No PayTR payment_transactions remaining';
  END IF;

  -- Check invoices
  SELECT COUNT(*) INTO paytr_count
  FROM invoices
  WHERE payment_provider = 'paytr';

  IF paytr_count > 0 THEN
    RAISE WARNING 'Found % invoices with payment_provider = ''paytr''', paytr_count;
  ELSE
    RAISE NOTICE 'No PayTR invoices remaining';
  END IF;

  -- Check subscription_plans metadata
  SELECT COUNT(*) INTO paytr_count
  FROM subscription_plans
  WHERE metadata ? 'paytr_product_id';

  IF paytr_count > 0 THEN
    RAISE WARNING 'Found % subscription_plans with paytr_product_id in metadata', paytr_count;
  ELSE
    RAISE NOTICE 'No PayTR metadata remaining in subscription_plans';
  END IF;
END $$;

-- =============================================================================
-- Step 8: Create summary of PayTR removal
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PayTR Legacy Removal Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removed:';
  RAISE NOTICE '  ✓ pending_renewal_payments table';
  RAISE NOTICE '  ✓ pending_subscriptions table';
  RAISE NOTICE '  ✓ payment_transactions.paytr_order_id column';
  RAISE NOTICE '  ✓ payment_transactions.paytr_conversation_id column';
  RAISE NOTICE '  ✓ PayTR payment_provider references';
  RAISE NOTICE '  ✓ PayTR metadata from subscription_plans';
  RAISE NOTICE '';
  RAISE NOTICE 'Backups created:';
  RAISE NOTICE '  ✓ pending_renewal_payments_backup';
  RAISE NOTICE '  ✓ pending_subscriptions_backup';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Remove PayTR API routes from codebase';
  RAISE NOTICE '  2. Delete lib/paytr-client.ts';
  RAISE NOTICE '  3. Delete PayTR documentation';
  RAISE NOTICE '  4. Remove PayTR env variables';
  RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- =============================================================================
-- Run these after migration to verify correctness:

-- Check 1: Verify PayTR tables are gone
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name LIKE '%paytr%'
--   OR table_name IN ('pending_renewal_payments', 'pending_subscriptions');
-- -- Should only return backup tables

-- Check 2: Verify backup tables exist
-- SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('pending_renewal_payments_backup', 'pending_subscriptions_backup');

-- Check 3: Verify all payment_provider values
-- SELECT payment_provider, COUNT(*)
-- FROM payment_transactions
-- GROUP BY payment_provider;
-- -- Should only show 'paddle' (or NULL for very old records)

-- SELECT payment_provider, COUNT(*)
-- FROM invoices
-- GROUP BY payment_provider;
-- -- Should only show 'paddle' (or NULL for very old records)

-- Check 4: Verify PayTR columns removed
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'payment_transactions'
--   AND column_name LIKE '%paytr%';
-- -- Should return 0 rows

-- =============================================================================
-- CLEANUP PLAN (to be run after verification period)
-- =============================================================================
-- After 2-4 weeks of verification, you can drop the backup tables:
--
-- DROP TABLE IF EXISTS pending_renewal_payments_backup CASCADE;
-- DROP TABLE IF EXISTS pending_subscriptions_backup CASCADE;
--
-- Note: Consider exporting backups to CSV first for archival

-- =============================================================================
-- ROLLBACK SCRIPT (if needed - NOT RECOMMENDED)
-- =============================================================================
-- Rollback is not recommended as PayTR is deprecated
-- If absolutely necessary:
--
-- -- Restore tables
-- CREATE TABLE pending_renewal_payments AS SELECT * FROM pending_renewal_payments_backup;
-- CREATE TABLE pending_subscriptions AS SELECT * FROM pending_subscriptions_backup;
--
-- -- Note: Cannot restore dropped columns without data loss
-- -- paytr_order_id and paytr_conversation_id data is lost
