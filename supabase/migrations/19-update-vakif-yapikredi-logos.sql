-- Vakıfbank logosunu güncelle
UPDATE public.banks 
SET logo_url = '/bank-icons/vakifbank.png'
WHERE name LIKE '%Vakıf%' AND name NOT LIKE '%Katılım%';

-- Yapı Kredi logosunu güncelle  
UPDATE public.banks 
SET logo_url = '/bank-icons/yapi-kredi-bankasi.png'
WHERE name LIKE '%Yapı%' AND name LIKE '%Kredi%';

-- Debug için güncellenmiş bankaları listele
SELECT id, name, logo_url, category FROM public.banks 
WHERE name LIKE '%Vakıf%' OR name LIKE '%Yapı%' 
ORDER BY name;
