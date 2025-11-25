-- SADECE BU SATIRI ÇALIŞTIRIN (tek seferde)
INSERT INTO subscription_plans (id, name, price, billing_interval, is_active)
VALUES ('premium-yearly', 'Yıllık Premium', 1990.00, 'yearly', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_interval = EXCLUDED.billing_interval,
  is_active = EXCLUDED.is_active;
