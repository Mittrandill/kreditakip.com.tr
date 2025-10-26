-- Script to link invoices with payments
-- When a payment is successful, create a pending invoice automatically

-- Add subscription_id and payment_id to invoices for tracking
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_id TEXT; -- Iyzico payment ID

-- Create index
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON public.invoices(payment_id);

-- Function to auto-create invoice when payment is successful
-- This will be called from the payment callback API
CREATE OR REPLACE FUNCTION create_invoice_for_payment(
  p_user_id UUID,
  p_subscription_id UUID,
  p_payment_id TEXT,
  p_amount DECIMAL,
  p_plan_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Generate invoice number (format: INV-YYYYMMDD-XXXXX)
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 5, '0')
  INTO v_invoice_number;

  -- Create invoice
  INSERT INTO public.invoices (
    user_id,
    subscription_id,
    payment_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    currency,
    status,
    description
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_payment_id,
    v_invoice_number,
    NOW(),
    NOW() + INTERVAL '7 days', -- Due in 7 days
    p_amount,
    'TRY',
    'pending', -- Start as pending, admin will upload PDF
    'Abonelik Ödemesi - ' || UPPER(p_plan_type) || ' Plan'
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sequence for invoice numbers if not exists
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Grant usage on sequence
GRANT USAGE ON SEQUENCE invoice_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE invoice_number_seq TO service_role;
