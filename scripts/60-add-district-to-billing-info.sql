-- Add district column to billing_info table
-- This stores the district (ilçe) information for complete address

-- Add district column
ALTER TABLE billing_info
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment
COMMENT ON COLUMN billing_info.district IS 'District (ilçe) information for billing address';

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'billing_info'
ORDER BY ordinal_position;
