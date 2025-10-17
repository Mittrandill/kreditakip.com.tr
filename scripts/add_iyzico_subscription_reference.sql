-- Subscriptions tablosuna iyzico abonelik referans kodu ekle
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS iyzico_subscription_reference VARCHAR(255);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_subscriptions_iyzico_ref 
ON subscriptions(iyzico_subscription_reference);

-- Yorum ekle
COMMENT ON COLUMN subscriptions.iyzico_subscription_reference IS 'iyzico abonelik referans kodu (subscription reference code)';
