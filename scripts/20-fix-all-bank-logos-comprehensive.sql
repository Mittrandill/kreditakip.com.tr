-- TÜM BANKA LOGOLARINI KAPSAMLI GÜNCELLEME
-- Bu script tüm kategorilerdeki bankaların logo_url'lerini düzeltir

-- 1. Devlet Bankaları
UPDATE public.banks 
SET logo_url = '/bank-icons/ziraat-bankasi.png'
WHERE name LIKE '%Ziraat%' AND name NOT LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-halk-bankasi.png'
WHERE name LIKE '%Halk%' AND name NOT LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/vakifbank.png'
WHERE name LIKE '%Vakıf%' AND name NOT LIKE '%Katılım%';

-- 2. Özel Sermayeli Bankalar
UPDATE public.banks 
SET logo_url = '/bank-icons/akbank.png'
WHERE name LIKE '%Akbank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-garanti-bankasi.png'
WHERE name LIKE '%Garanti%';

UPDATE public.banks 
SET logo_url = '/bank-icons/yapi-kredi-bankasi.png'
WHERE name LIKE '%Yapı%' AND name LIKE '%Kredi%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-is-bankasi.png'
WHERE name LIKE '%İş Bankası%';

UPDATE public.banks 
SET logo_url = '/bank-icons/qnb-finansbank.png'
WHERE name LIKE '%QNB%' OR name LIKE '%Finansbank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-ekonomi-bankasi.png'
WHERE name LIKE '%Ekonomi Bankası%' OR name LIKE '%T.E.B%' OR name = 'Türkiye Ekonomi Bankası A.Ş.';

UPDATE public.banks 
SET logo_url = '/bank-icons/sekerbank.png'
WHERE name LIKE '%Şekerbank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/anadolubank.png'
WHERE name LIKE '%Anadolubank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/fibabanka.png'
WHERE name LIKE '%Fibabanka%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkish-bank.png'
WHERE name LIKE '%Turkish Bank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/denizbank.png'
WHERE name LIKE '%DenizBank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/ing-bank.png'
WHERE name LIKE '%ING%';

UPDATE public.banks 
SET logo_url = '/bank-icons/citibank.png'
WHERE name LIKE '%Citibank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/deutsche-bank.png'
WHERE name LIKE '%Deutsche%';

UPDATE public.banks 
SET logo_url = '/bank-icons/alternatif-bank.png'
WHERE name LIKE '%Alternatif%';

UPDATE public.banks 
SET logo_url = '/bank-icons/burgan-bank.png'
WHERE name LIKE '%Burgan%';

UPDATE public.banks 
SET logo_url = '/bank-icons/icbc-turkey-bank.png'
WHERE name LIKE '%ICBC%';

UPDATE public.banks 
SET logo_url = '/bank-icons/mufg-bank-turkey.png'
WHERE name LIKE '%MUFG%';

UPDATE public.banks 
SET logo_url = '/bank-icons/odeabank.png'
WHERE name LIKE '%Odea%';

UPDATE public.banks 
SET logo_url = '/bank-icons/rabobank.png'
WHERE name LIKE '%Rabobank%';

-- 3. Yabancı Şubeler
UPDATE public.banks 
SET logo_url = '/bank-icons/hsbc-bank.png'
WHERE name LIKE '%HSBC%';

UPDATE public.banks 
SET logo_url = '/bank-icons/intesa-sanpaolo.png'
WHERE name LIKE '%Intesa%';

UPDATE public.banks 
SET logo_url = '/bank-icons/habib-bank-limited.png'
WHERE name LIKE '%Habib%';

UPDATE public.banks 
SET logo_url = '/bank-icons/bank-mellat.png'
WHERE name LIKE '%Mellat%';

UPDATE public.banks 
SET logo_url = '/bank-icons/jpmorgan-chase-bank.png'
WHERE name LIKE '%JPMorgan%' OR name LIKE '%Chase%';

UPDATE public.banks 
SET logo_url = '/bank-icons/societe-generale.png'
WHERE name LIKE '%Société%' OR name LIKE '%Generale%';

-- 4. Katılım Bankaları
UPDATE public.banks 
SET logo_url = '/bank-icons/ziraat-katilim-bankasi.png'
WHERE name LIKE '%Ziraat%' AND name LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/vakif-katilim-bankasi.png'
WHERE name LIKE '%Vakıf%' AND name LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-emlak-katilim-bankasi.png'
WHERE name LIKE '%Emlak%' AND name LIKE '%Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/kuveyt-turk-katilim-bankasi.png'
WHERE name LIKE '%Kuveyt%';

UPDATE public.banks 
SET logo_url = '/bank-icons/albaraka-turk-katilim-bankasi.png'
WHERE name LIKE '%Albaraka%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-finans-katilim-bankasi.png'
WHERE name LIKE '%Türkiye Finans%' OR name LIKE '%Finans Katılım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/hayat-finans-katilim-bankasi.png'
WHERE name LIKE '%Hayat%' AND name LIKE '%Finans%';

UPDATE public.banks 
SET logo_url = '/bank-icons/dunya-katilim-bankasi.png'
WHERE name LIKE '%Dünya%' AND name LIKE '%Katılım%';

-- 5. Kalkınma ve Yatırım Bankaları
UPDATE public.banks 
SET logo_url = '/bank-icons/iller-bankasi.png'
WHERE name LIKE '%İller%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turk-eximbank.png'
WHERE name LIKE '%Eximbank%' OR name LIKE '%İhracat%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png'
WHERE name LIKE '%Kalkınma%' AND name LIKE '%Yatırım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turkiye-sinai-kalkinma-bankasi.png'
WHERE name LIKE '%Sınai%' AND name LIKE '%Kalkınma%';

UPDATE public.banks 
SET logo_url = '/bank-icons/aktif-yatirim-bankasi.png'
WHERE name LIKE '%Aktif%' AND name LIKE '%Yatırım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/nurol-yatirim-bankasi.png'
WHERE name LIKE '%Nurol%' AND name LIKE '%Yatırım%';

UPDATE public.banks 
SET logo_url = '/bank-icons/pasha-yatirim-bankasi.png'
WHERE name LIKE '%Pasha%' OR name LIKE '%PASHA%';

UPDATE public.banks 
SET logo_url = '/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png'
WHERE name LIKE '%BankPozitif%' OR name LIKE '%Pozitif%';

UPDATE public.banks 
SET logo_url = '/bank-icons/merrill-lynch-yatirim-bank.png'
WHERE name LIKE '%Merrill%' OR name LIKE '%Lynch%';

UPDATE public.banks 
SET logo_url = '/bank-icons/golden-global-yatirim-bankasi.png'
WHERE name LIKE '%Golden%' AND name LIKE '%Global%';

UPDATE public.banks 
SET logo_url = '/bank-icons/gsd-yatirim-bankasi.png'
WHERE name LIKE '%GSD%';

UPDATE public.banks 
SET logo_url = '/bank-icons/istanbul-takas-ve-saklama-bankasi.png'
WHERE name LIKE '%İstanbul%' AND name LIKE '%Takas%';

UPDATE public.banks 
SET logo_url = '/bank-icons/diler-yatirim-bankasi.png'
WHERE name LIKE '%Diler%';

UPDATE public.banks 
SET logo_url = '/bank-icons/standard-chartered-yatirim-bankasi-turk.png'
WHERE name LIKE '%Standard%' AND name LIKE '%Chartered%';

-- 6. Dijital Bankalar
UPDATE public.banks 
SET logo_url = '/bank-icons/enpara-bank.png'
WHERE name LIKE '%Enpara%';

UPDATE public.banks 
SET logo_url = '/bank-icons/colendi-bank.png'
WHERE name LIKE '%Colendi%';

-- 7. TMSF Bankaları
UPDATE public.banks 
SET logo_url = '/bank-icons/adabank.png'
WHERE name LIKE '%Adabank%';

UPDATE public.banks 
SET logo_url = '/bank-icons/birlesik-fon-bankasi.png'
WHERE name LIKE '%Birleşik%' AND name LIKE '%Fon%';

UPDATE public.banks 
SET logo_url = '/bank-icons/turk-ticaret-bankasi.png'
WHERE name LIKE '%Türk%' AND name LIKE '%Ticaret%';

-- Debug: Güncellenmiş bankaları listele
SELECT 
    id, 
    name, 
    logo_url, 
    category,
    CASE 
        WHEN logo_url IS NULL OR logo_url = '' THEN '❌ Logo Yok'
        WHEN logo_url LIKE '/bank-icons/%' THEN '✅ Logo Var'
        ELSE '⚠️ Eski Logo'
    END as logo_status
FROM public.banks 
ORDER BY category, name;

-- İstatistik: Logo durumu özeti
SELECT 
    category,
    COUNT(*) as total_banks,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as banks_with_logo,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as banks_without_logo
FROM public.banks 
GROUP BY category
ORDER BY category;
