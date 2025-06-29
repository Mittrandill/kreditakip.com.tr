-- credit_types tablosuna category kolonu ekle
ALTER TABLE credit_types ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Mevcut kayıtları güncelle
UPDATE credit_types SET category = 'Bireysel Krediler' WHERE category IS NULL;
