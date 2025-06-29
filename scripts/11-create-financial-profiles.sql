-- Kullanıcının detaylı finansal bilgilerini saklamak için tablo
CREATE TABLE financial_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_income NUMERIC CHECK (monthly_income >= 0) DEFAULT 0,
    monthly_expenses NUMERIC CHECK (monthly_expenses >= 0) DEFAULT 0,
    total_assets NUMERIC CHECK (total_assets >= 0) DEFAULT 0,
    total_liabilities NUMERIC CHECK (total_liabilities >= 0) DEFAULT 0,
    employment_status TEXT, -- Örn: 'tam_zamanli', 'yari_zamanli', 'serbest_calisan', 'issiz', 'ogrenci', 'emekli'
    housing_status TEXT, -- Örn: 'kira', 'ev_sahibi_kredili', 'ev_sahibi_kredisiz', 'aile_yani'
    other_debt_obligations TEXT, -- Diğer borç yükümlülükleri (kredi kartı borcu, öğrenim kredisi vb.)
    savings_goals TEXT, -- Tasarruf hedefleri
    risk_tolerance TEXT, -- Kullanıcının kendi belirttiği risk toleransı (örn: 'dusuk', 'orta', 'yuksek')
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Politikaları
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi finansal profillerini görebilir"
ON financial_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi finansal profillerini ekleyebilir"
ON financial_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi finansal profillerini güncelleyebilir"
ON financial_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 'updated_at' timestamp'ini güncellemek için trigger fonksiyonu (zaten mevcut olabilir, yoksa ekleyin)
-- CREATE OR REPLACE FUNCTION public.handle_updated_at() ... (önceki örneklerdeki gibi)

CREATE TRIGGER on_financial_profiles_updated
  BEFORE UPDATE ON financial_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

COMMENT ON COLUMN financial_profiles.employment_status IS 'Örn: tam_zamanli, yari_zamanli, serbest_calisan, issiz, ogrenci, emekli';
COMMENT ON COLUMN financial_profiles.housing_status IS 'Örn: kira, ev_sahibi_kredili, ev_sahibi_kredisiz, aile_yani';
COMMENT ON COLUMN financial_profiles.risk_tolerance IS 'Kullanıcının kendi belirttiği risk toleransı (örn: dusuk, orta, yuksek)';
