-- Bu user için tüm payment_plans'ı görelim
SELECT
  pp.id,
  pp.due_date,
  pp.status,
  pp.installment_number,
  pp.total_payment,
  c.user_id,
  c.credit_code,
  b.name as bank_name
FROM payment_plans pp
INNER JOIN credits c ON pp.credit_id = c.id
LEFT JOIN banks b ON c.bank_id = b.id
WHERE c.user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3'
  AND pp.due_date >= '2025-11-05'
  AND pp.due_date <= '2025-11-08'
ORDER BY pp.due_date;

-- Eğer sonuç boşsa, bu user'ın TÜM payment_plans'larına bakalım:
SELECT
  pp.id,
  pp.due_date,
  pp.status,
  pp.installment_number,
  c.credit_code,
  b.name as bank_name
FROM payment_plans pp
INNER JOIN credits c ON pp.credit_id = c.id
LEFT JOIN banks b ON c.bank_id = b.id
WHERE c.user_id = '55d661b4-bf49-400f-a7eb-ec9928148fc3'
ORDER BY pp.due_date DESC
LIMIT 20;
