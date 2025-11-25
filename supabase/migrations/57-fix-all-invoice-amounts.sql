-- Fix all invoice amounts from payment_transactions

-- Show invoices with wrong amounts
SELECT 
    i.id,
    i.invoice_number,
    i.user_id,
    i.amount as current_invoice_amount,
    pt.amount as correct_amount,
    i.subscription_id
FROM invoices i
LEFT JOIN payment_transactions pt ON i.subscription_id = pt.subscription_id
WHERE i.amount != pt.amount OR pt.amount IS NULL;

-- Update all invoices with correct amounts from payment_transactions
UPDATE invoices 
SET 
    amount = pt.amount,
    currency = pt.currency,
    updated_at = NOW()
FROM payment_transactions pt
WHERE invoices.subscription_id = pt.subscription_id
  AND invoices.amount != pt.amount;

-- Verify the fix
SELECT 
    i.id,
    i.invoice_number,
    i.amount as invoice_amount,
    pt.amount as transaction_amount,
    CASE 
        WHEN i.amount = pt.amount THEN '✓ Match'
        ELSE '✗ Mismatch'
    END as status
FROM invoices i
LEFT JOIN payment_transactions pt ON i.subscription_id = pt.subscription_id
ORDER BY i.created_at DESC;
