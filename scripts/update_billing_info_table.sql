-- Add VKN (Vergi Kimlik Numarası) and district fields to billing_info table

ALTER TABLE billing_info
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(11),
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Add comment to explain the fields
COMMENT ON COLUMN billing_info.tax_id IS 'Vergi Kimlik Numarası (VKN) - 10 or 11 digits';
COMMENT ON COLUMN billing_info.district IS 'İlçe (District) of the city';
