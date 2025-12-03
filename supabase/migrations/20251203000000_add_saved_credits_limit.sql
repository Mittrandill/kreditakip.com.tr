-- Add saved_credits_limit column to subscription_usage table
ALTER TABLE subscription_usage
ADD COLUMN IF NOT EXISTS saved_credits_limit INTEGER DEFAULT 1;

-- Update existing records based on plan type
-- Free users: 1 saved credit
-- Pro users: 10 saved credits
-- Premium users: unlimited (999999)

-- First, let's update based on limit_count as a proxy for plan type
-- If limit_count is 999999 (unlimited OCR), it's premium
-- If limit_count is 10, it's pro
-- If limit_count is 1, it's free

UPDATE subscription_usage
SET saved_credits_limit = CASE
  WHEN feature_type = 'ocr_analysis' AND limit_count = 999999 THEN 999999  -- Premium
  WHEN feature_type = 'ocr_analysis' AND limit_count = 10 THEN 10          -- Pro
  WHEN feature_type = 'ocr_analysis' AND limit_count = 1 THEN 1            -- Free
  ELSE 1  -- Default to free
END
WHERE feature_type = 'ocr_analysis';

-- Add comment to the column
COMMENT ON COLUMN subscription_usage.saved_credits_limit IS 'Maximum number of credits that can be saved from OCR analysis (1 for free, 10 for pro, unlimited for premium)';
