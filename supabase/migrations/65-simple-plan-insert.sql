-- SADECE BU SATIRI ÇALIŞTIRIN (tek seferde)
INSERT INTO subscription_plans (id, name, price, billing_interval, is_active)
VALUES ('premium-monthly', 'Aylık Premium', 199.00, 'monthly', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_interval = EXCLUDED.billing_interval,
  is_active = EXCLUDED.is_active;
