-- Add calculated_interest_rate column to credits table
ALTER TABLE credits 
ADD COLUMN calculated_interest_rate DECIMAL(5,2) DEFAULT NULL;

-- Add total_payback column to credits table  
ALTER TABLE credits 
ADD COLUMN total_payback DECIMAL(15,2) DEFAULT 0;

-- Update existing records to set total_payback equal to initial_amount for now
UPDATE credits 
SET total_payback = initial_amount 
WHERE total_payback = 0;
