-- Add theme column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON public.profiles(theme);

-- Add comment
COMMENT ON COLUMN public.profiles.theme IS 'User theme preference: light, dark, or system';

-- Update existing users to light theme (default)
UPDATE public.profiles
SET theme = 'light'
WHERE theme IS NULL;
