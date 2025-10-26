-- Check user's invoice and transaction data
-- User ID: 55d661b4-bf49-400f-a7eb-ec9928148fc3

-- 1. Check payment transactions
SELECT 
    id,
    subscription_id,
    amount,
    currency,
    status,
    created_at
FROM payment_transactions 
WHERE user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3'
ORDER BY created_at DESC;

-- 2. Check invoices
SELECT 
    id,
    invoice_number,
    subscription_id,
    payment_id,
    amount,
    currency,
    status,
    file_url,
    created_at
FROM invoices 
WHERE user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3'
ORDER BY created_at DESC;

-- 3. Update invoice amount from payment_transactions
-- First, let's see if they match
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.amount as invoice_amount,
    i.currency as invoice_currency,
    pt.amount as transaction_amount,
    pt.currency as transaction_currency,
    i.subscription_id
FROM invoices i
LEFT JOIN payment_transactions pt ON i.subscription_id = pt.subscription_id
WHERE i.user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3';

-- 4. Fix invoice amount if needed (uncomment to run)
-- UPDATE invoices 
-- SET amount = pt.amount,
--     currency = pt.currency
-- FROM payment_transactions pt
-- WHERE invoices.subscription_id = pt.subscription_id
--   AND invoices.user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3'
--   AND invoices.amount != pt.amount;
