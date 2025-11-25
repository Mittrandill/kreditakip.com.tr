-- Bankacılık şifrelerine yeni alanlar ekle
ALTER TABLE banking_credentials 
ADD COLUMN password_change_frequency_days INTEGER DEFAULT NULL,
ADD COLUMN last_password_change_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Mevcut kayıtlar için last_password_change_date'i created_at ile aynı yap
UPDATE banking_credentials 
SET last_password_change_date = created_at 
WHERE last_password_change_date IS NULL;

-- Yorum ekle
COMMENT ON COLUMN banking_credentials.password_change_frequency_days IS 'Şifre değişim sıklığı (gün cinsinden)';
COMMENT ON COLUMN banking_credentials.last_password_change_date IS 'Son şifre değiştirme tarihi';
