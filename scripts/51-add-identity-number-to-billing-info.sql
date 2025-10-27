-- Add identity_number column to billing_info table
-- This will store the TC (identity) number from payment checkout

ALTER TABLE billing_info
ADD COLUMN IF NOT EXISTS identity_number VARCHAR(11);

-- Add comment to document the column
COMMENT ON COLUMN billing_info.identity_number IS 'Turkish identity number (TC Kimlik No) collected during payment';

-- Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_billing_info_identity_number ON billing_info(identity_number);
