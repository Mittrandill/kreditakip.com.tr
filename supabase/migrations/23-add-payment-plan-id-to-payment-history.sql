-- Add payment_plan_id column to payment_history table to track which installment was paid
ALTER TABLE payment_history 
ADD COLUMN payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_payment_history_payment_plan_id ON payment_history(payment_plan_id);

-- Update existing records to link them with payment plans where possible
-- This is a best-effort update based on dates and amounts
UPDATE payment_history ph
SET payment_plan_id = pp.id
FROM payment_plans pp
WHERE ph.credit_id = pp.credit_id
  AND ph.amount = pp.total_payment
  AND ph.payment_date = pp.due_date
  AND ph.payment_plan_id IS NULL;
