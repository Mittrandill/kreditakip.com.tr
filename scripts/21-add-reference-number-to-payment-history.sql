-- Add reference_number column to payment_history table
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Add payment_channel column if it doesn't exist
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50);

-- Add notes column if it doesn't exist
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records with default values
UPDATE payment_history 
SET reference_number = 'PAY-' || id::text || '-' || EXTRACT(epoch FROM created_at)::text
WHERE reference_number IS NULL;

UPDATE payment_history 
SET payment_channel = 'banka-havalesi'
WHERE payment_channel IS NULL;
