-- Create invoices table for invoice management
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  file_url TEXT, -- URL to the invoice PDF in storage
  file_name TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Internal admin notes
  created_by UUID REFERENCES auth.users(id), -- Admin who created the invoice
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can only view their own invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert invoices
CREATE POLICY "Only admins can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update invoices
CREATE POLICY "Only admins can update invoices"
  ON public.invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete invoices
CREATE POLICY "Only admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- Create storage bucket for invoices (if not exists)
-- This needs to be run in Supabase dashboard or using supabase-js
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Storage policies for invoices bucket
-- CREATE POLICY "Users can view their own invoices"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'invoices' AND (
--       auth.uid()::text = (storage.foldername(name))[1] OR
--       EXISTS (
--         SELECT 1 FROM public.profiles
--         WHERE id = auth.uid() AND is_admin = true
--       )
--     )
--   );

-- CREATE POLICY "Only admins can upload invoices"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'invoices' AND
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND is_admin = true
--     )
--   );

-- CREATE POLICY "Only admins can delete invoices"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'invoices' AND
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND is_admin = true
--     )
--   );
