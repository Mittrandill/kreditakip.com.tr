-- Create storage bucket for invoice PDFs
-- Note: This needs to be run in Supabase SQL Editor with proper permissions
-- Or use Supabase Dashboard > Storage > New Bucket

-- Insert bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Public Access for Invoice PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Create storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Create storage policy for service role (admin)
CREATE POLICY "Service role can manage all invoice files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'invoices';
