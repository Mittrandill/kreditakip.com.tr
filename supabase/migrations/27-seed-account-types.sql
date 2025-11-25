-- Hesap türleri için örnek veriler (isteğe bağlı)
-- Bu veriler UI'da dropdown seçenekleri olarak kullanılabilir
-- This script seeds some sample data for testing
-- In production, users will add their own accounts and credit cards

-- Hesap türleri zaten CHECK constraint ile tanımlandı:
-- 'vadesiz', 'vadeli', 'tasarruf', 'yatirim', 'diger'

-- Kredi kartı türleri zaten CHECK constraint ile tanımlandı:
-- 'kredi', 'bankakarti', 'prepaid'

-- Para birimleri zaten CHECK constraint ile tanımlandı:
-- 'TRY', 'USD', 'EUR', 'GBP'

-- İşlem türleri zaten CHECK constraint ile tanımlandı:
-- Hesap: 'giris', 'cikis', 'faiz', 'komisyon', 'transfer'
-- Kredi kartı: 'harcama', 'odeme', 'faiz', 'komisyon', 'iade'

-- Note: This is just for reference, actual data will be added by users through the UI
