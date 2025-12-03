-- Add email preference fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_monthly_summary BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_weekly_summary BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN public.profiles.email_monthly_summary IS 'Aylık ödeme özeti e-postası alınsın mı (her ayın 1''i)';
COMMENT ON COLUMN public.profiles.email_weekly_summary IS 'Haftalık ödeme özeti e-postası alınsın mı (her Pazartesi)';
