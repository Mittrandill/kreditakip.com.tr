-- Clean duplicate invoices
-- Keep only one invoice per subscription_id:
-- 1. If there's an invoice with file_url, keep that one
-- 2. Otherwise, keep the most recent one

-- First, let's see what we have
SELECT
  subscription_id,
  COUNT(*) as invoice_count,
  SUM(CASE WHEN file_url IS NOT NULL THEN 1 ELSE 0 END) as with_pdf_count
FROM invoices
GROUP BY subscription_id
HAVING COUNT(*) > 1
ORDER BY invoice_count DESC;

-- Delete duplicate invoices
-- For each subscription_id, keep only:
-- - The invoice with file_url if exists
-- - Otherwise, the most recent invoice
DELETE FROM invoices
WHERE id IN (
  SELECT i.id
  FROM invoices i
  WHERE EXISTS (
    -- Check if there are duplicates for this subscription
    SELECT 1
    FROM invoices i2
    WHERE i2.subscription_id = i.subscription_id
    GROUP BY i2.subscription_id
    HAVING COUNT(*) > 1
  )
  AND i.id NOT IN (
    -- Keep the invoice with PDF, or if none, the most recent one
    SELECT DISTINCT ON (subscription_id)
      id
    FROM invoices
    WHERE subscription_id = i.subscription_id
    ORDER BY
      subscription_id,
      CASE WHEN file_url IS NOT NULL THEN 0 ELSE 1 END, -- Prioritize invoices with PDF
      created_at DESC -- Then most recent
  )
);

-- Verify cleanup
SELECT
  subscription_id,
  COUNT(*) as invoice_count,
  MAX(file_url IS NOT NULL) as has_pdf
FROM invoices
GROUP BY subscription_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if cleanup was successful
