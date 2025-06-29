-- Add category column to banks table
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Diğer';

-- Update existing banks with categories
UPDATE public.banks SET category = 'Devlet Bankaları' WHERE name IN ('Ziraat Bankası', 'Halkbank', 'Vakıfbank');
UPDATE public.banks SET category = 'Yabancı Bankalar' WHERE name IN ('Garanti BBVA', 'Denizbank', 'QNB Finansbank', 'ING Bank', 'HSBC');
UPDATE public.banks SET category = 'Özel Sektör Bankaları' WHERE name IN ('Akbank', 'İş Bankası', 'Yapı Kredi', 'TEB');
UPDATE public.banks SET category = 'Katılım Bankaları' WHERE name LIKE '%Katılım%';
