-- Vakıf Katılım Bankası logo yolunu düzelt
UPDATE public.banks 
SET logo_url = '/bank-icons/vakif-katilim-bankasi.png'
WHERE name = 'Vakıf Katılım Bankası A.Ş.';

-- Tüm bankaların logo durumunu kontrol et
SELECT id, name, logo_url, category 
FROM public.banks 
WHERE logo_url IS NOT NULL
ORDER BY category, name;
