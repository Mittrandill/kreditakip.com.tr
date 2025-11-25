-- Finansal profil tablosunu iyileştir ve daha detaylı alanlar ekle
ALTER TABLE financial_profiles 
ADD COLUMN IF NOT EXISTS employment_duration_months INTEGER CHECK (employment_duration_months >= 0),
ADD COLUMN IF NOT EXISTS annual_income NUMERIC CHECK (annual_income >= 0),
ADD COLUMN IF NOT EXISTS emergency_fund NUMERIC CHECK (emergency_fund >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_portfolio NUMERIC CHECK (investment_portfolio >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_estate_value NUMERIC CHECK (real_estate_value >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicle_value NUMERIC CHECK (vehicle_value >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_assets NUMERIC CHECK (other_assets >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_card_debt NUMERIC CHECK (credit_card_debt >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_monthly_obligations NUMERIC CHECK (other_monthly_obligations >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dependents_count INTEGER CHECK (dependents_count >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS industry_sector TEXT,
ADD COLUMN IF NOT EXISTS monthly_rent_mortgage NUMERIC CHECK (monthly_rent_mortgage >= 0) DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_health_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_life_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS financial_goals TEXT,
ADD COLUMN IF NOT EXISTS investment_experience TEXT;

-- Yorum ekle
COMMENT ON COLUMN financial_profiles.employment_duration_months IS 'Mevcut işte çalışma süresi (ay)';
COMMENT ON COLUMN financial_profiles.annual_income IS 'Yıllık brüt gelir';
COMMENT ON COLUMN financial_profiles.emergency_fund IS 'Acil durum fonu miktarı';
COMMENT ON COLUMN financial_profiles.investment_portfolio IS 'Yatırım portföyü değeri';
COMMENT ON COLUMN financial_profiles.real_estate_value IS 'Gayrimenkul değeri';
COMMENT ON COLUMN financial_profiles.vehicle_value IS 'Araç değeri';
COMMENT ON COLUMN financial_profiles.other_assets IS 'Diğer varlıklar';
COMMENT ON COLUMN financial_profiles.credit_card_debt IS 'Kredi kartı borcu';
COMMENT ON COLUMN financial_profiles.other_monthly_obligations IS 'Diğer aylık yükümlülükler';
COMMENT ON COLUMN financial_profiles.dependents_count IS 'Bakmakla yükümlü kişi sayısı';
COMMENT ON COLUMN financial_profiles.education_level IS 'Eğitim seviyesi';
COMMENT ON COLUMN financial_profiles.industry_sector IS 'Çalışılan sektör';
COMMENT ON COLUMN financial_profiles.monthly_rent_mortgage IS 'Aylık kira/mortgage ödemesi';
COMMENT ON COLUMN financial_profiles.has_health_insurance IS 'Sağlık sigortası var mı';
COMMENT ON COLUMN financial_profiles.has_life_insurance IS 'Hayat sigortası var mı';
COMMENT ON COLUMN financial_profiles.financial_goals IS 'Finansal hedefler';
COMMENT ON COLUMN financial_profiles.investment_experience IS 'Yatırım deneyimi';
