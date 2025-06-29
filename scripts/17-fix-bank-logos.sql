-- Ziraat Bankası logo yolunu güncelle
UPDATE public.banks 
SET logo_url = '/bank-icons/ziraat-bankasi.png'
WHERE name LIKE '%Ziraat%';

-- Diğer ana bankaların logo yollarını da güncelle
UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-halk-bankasi.png'
WHERE name LIKE '%Halk%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-vakiflar-bankasi.png'
WHERE name LIKE '%Vakıf%' AND name NOT LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/akbank.png'
WHERE name LIKE '%Akbank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-garanti-bankasi.png'
WHERE name LIKE '%Garanti%';

UPDATE public.banks 
SET logo_url = '/bank-icons/yapi-ve-kredi-bankasi.png'
WHERE name LIKE '%Yapı%' AND name LIKE '%Kredi%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-is-bankasi.png'
WHERE name LIKE '%İş Bankası%';

UPDATE public.banks 
SET logo_url = '/bank-icons/qnb-finansbank.png'
WHERE name LIKE '%QNB%' OR name LIKE '%Finansbank%';

-- Debug için bankaları listele
SELECT id, name, logo_url, category FROM public.banks 
WHERE name LIKE '%Ziraat%' OR name LIKE '%Halk%' OR name LIKE '%Vakıf%' 
ORDER BY name;
