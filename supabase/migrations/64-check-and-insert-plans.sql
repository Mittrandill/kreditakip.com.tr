-- Önce mevcut planları kontrol et
SELECT id, name, price, billing_interval, is_active
FROM subscription_plans
WHERE id IN ('premium-monthly', 'premium-yearly');

-- Eğer sonuç boşsa veya eksikse, aşağıdaki INSERT'leri tek tek çalıştırın
