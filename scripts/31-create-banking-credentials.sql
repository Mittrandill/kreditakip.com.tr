-- Banking credentials tablosunu oluştur
CREATE TABLE IF NOT EXISTS banking_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    credential_name VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    encrypted_password TEXT,
    credential_type VARCHAR(50) DEFAULT 'internet_banking' CHECK (credential_type IN ('internet_banking', 'mobile_banking', 'phone_banking', 'other')),
    notes TEXT,
    last_used_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: Aynı kullanıcı aynı banka için aynı tipte sadece bir credential saklayabilir
    UNIQUE(user_id, bank_id, credential_type)
);

-- RLS'i etkinleştir
ALTER TABLE banking_credentials ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi credential'larını görebilir
CREATE POLICY "Users can view own banking credentials" ON banking_credentials
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi credential'larını ekleyebilir
CREATE POLICY "Users can insert own banking credentials" ON banking_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi credential'larını güncelleyebilir
CREATE POLICY "Users can update own banking credentials" ON banking_credentials
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi credential'larını silebilir
CREATE POLICY "Users can delete own banking credentials" ON banking_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger'ı ekle
CREATE OR REPLACE FUNCTION update_banking_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banking_credentials_updated_at
    BEFORE UPDATE ON banking_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_banking_credentials_updated_at();

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_banking_credentials_user_id ON banking_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_credentials_bank_id ON banking_credentials(bank_id);
CREATE INDEX IF NOT EXISTS idx_banking_credentials_active ON banking_credentials(user_id, is_active);
