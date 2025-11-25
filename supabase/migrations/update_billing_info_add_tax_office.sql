-- Add tax_office column to billing_info table
ALTER TABLE billing_info 
ADD COLUMN IF NOT EXISTS tax_office VARCHAR(255);

-- Add district column if it doesn't exist
ALTER TABLE billing_info 
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Update the comment
COMMENT ON TABLE billing_info IS 'Stores user billing information including tax details';
COMMENT ON COLUMN billing_info.tax_id IS 'Turkish Tax ID Number (VKN - 11 digits)';
COMMENT ON COLUMN billing_info.tax_office IS 'Tax office name';
COMMENT ON COLUMN billing_info.district IS 'District (İlçe) within the city';
