-- Finansal profil tablosuna eksik alanları ekle
ALTER TABLE financial_profiles 
ADD COLUMN IF NOT EXISTS real_estate_value NUMERIC CHECK (real_estate_value >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicle_value NUMERIC CHECK (vehicle_value >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_card_debt NUMERIC CHECK (credit_card_debt >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS emergency_fund NUMERIC CHECK (emergency_fund >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_investments NUMERIC CHECK (other_investments >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_deposits NUMERIC CHECK (bank_deposits >= 0) DEFAULT 0;

-- Yorumlar ekle
COMMENT ON COLUMN financial_profiles.real_estate_value IS 'Sahip olunan gayrimenkul değeri';
COMMENT ON COLUMN financial_profiles.vehicle_value IS 'Sahip olunan araç değeri';
COMMENT ON COLUMN financial_profiles.credit_card_debt IS 'Toplam kredi kartı borcu';
COMMENT ON COLUMN financial_profiles.emergency_fund IS 'Acil durum fonu';
COMMENT ON COLUMN financial_profiles.other_investments IS 'Diğer yatırımlar';
COMMENT ON COLUMN financial_profiles.bank_deposits IS 'Banka mevduatları';
