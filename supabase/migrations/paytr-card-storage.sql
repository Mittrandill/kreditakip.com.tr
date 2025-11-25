-- PayTR Kart Saklama (CAPI) Tabloları
-- Bu migration PayTR CAPI sistemi için gerekli tabloları oluşturur

-- 1. Kullanıcı Token Tablosu
-- Her kullanıcının PayTR'daki utoken'ını saklar
CREATE TABLE IF NOT EXISTS paytr_user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    utoken VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_token UNIQUE (user_id, utoken)
);

-- 2. Kayıtlı Kartlar Tablosu
-- Kullanıcının PayTR'da kayıtlı kartlarını saklar
CREATE TABLE IF NOT EXISTS paytr_saved_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    utoken VARCHAR(255) NOT NULL REFERENCES paytr_user_tokens(utoken) ON DELETE CASCADE,
    ctoken VARCHAR(255) NOT NULL UNIQUE,

    -- Kart bilgileri (güvenli, hassas data yok)
    last_4 VARCHAR(4) NOT NULL,
    card_holder_name VARCHAR(100),
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(2) NOT NULL,
    require_cvv BOOLEAN DEFAULT false,

    -- Kart metadata
    bank_name VARCHAR(100),
    card_brand VARCHAR(50), -- maximum, bonus, world, vb.
    card_type VARCHAR(20), -- credit, debit
    card_schema VARCHAR(20), -- VISA, MASTERCARD, AMEX, TROY
    is_business_card BOOLEAN DEFAULT false,

    -- Durumlar
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_card_token UNIQUE (user_id, ctoken)
);

-- 3. Recurring Payment İşlem Tablosu
-- Otomatik ödeme işlemlerini takip eder
CREATE TABLE IF NOT EXISTS paytr_recurring_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- PayTR bilgileri
    utoken VARCHAR(255) NOT NULL,
    ctoken VARCHAR(255) NOT NULL,
    merchant_oid VARCHAR(64) NOT NULL UNIQUE,

    -- Ödeme bilgileri
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_status VARCHAR(50) NOT NULL, -- pending, success, failed, wait_callback

    -- İşlem sonucu
    paytr_status VARCHAR(50), -- PayTR'den dönen status
    error_message TEXT,
    try_again BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_paytr_user_tokens_user_id ON paytr_user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_user_tokens_utoken ON paytr_user_tokens(utoken);

CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_user_id ON paytr_saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_utoken ON paytr_saved_cards(utoken);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_ctoken ON paytr_saved_cards(ctoken);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_is_default ON paytr_saved_cards(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_is_active ON paytr_saved_cards(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_user_id ON paytr_recurring_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_subscription_id ON paytr_recurring_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_merchant_oid ON paytr_recurring_payments(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_status ON paytr_recurring_payments(payment_status);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_paytr_user_tokens_updated_at
    BEFORE UPDATE ON paytr_user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paytr_saved_cards_updated_at
    BEFORE UPDATE ON paytr_saved_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Politikaları
ALTER TABLE paytr_user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE paytr_saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE paytr_recurring_payments ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kayıtlarını görebilir
CREATE POLICY "Users can view own tokens"
    ON paytr_user_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cards"
    ON paytr_saved_cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
    ON paytr_saved_cards FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
    ON paytr_saved_cards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recurring payments"
    ON paytr_recurring_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (backend) tüm işlemleri yapabilir
CREATE POLICY "Service role has full access to tokens"
    ON paytr_user_tokens FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to cards"
    ON paytr_saved_cards FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to recurring payments"
    ON paytr_recurring_payments FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Yorum ekle
COMMENT ON TABLE paytr_user_tokens IS 'PayTR kullanıcı tokenları (utoken) - Her kullanıcı için benzersiz';
COMMENT ON TABLE paytr_saved_cards IS 'PayTR''da kayıtlı kullanıcı kartları (ctoken) - PCI-DSS compliant';
COMMENT ON TABLE paytr_recurring_payments IS 'Otomatik ödeme işlem geçmişi - Recurring payments';

COMMENT ON COLUMN paytr_saved_cards.last_4 IS 'Kartın son 4 hanesi (örn: 1234)';
COMMENT ON COLUMN paytr_saved_cards.require_cvv IS 'Bu kart ile ödeme yaparken CVV gerekli mi?';
COMMENT ON COLUMN paytr_saved_cards.is_default IS 'Kullanıcının varsayılan kartı mı?';
COMMENT ON COLUMN paytr_recurring_payments.try_again IS 'PayTR''den gelen try_again flag - Tekrar denenmeli mi?';
