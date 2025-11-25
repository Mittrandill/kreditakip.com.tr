-- ADIM 1: Constraint'i kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- ADIM 2: Mevcut tüm değerleri göster
SELECT
  'Mevcut değerler:' as info,
  notification_type,
  COUNT(*) as count
FROM notifications
GROUP BY notification_type;

-- ADIM 3: TÜM kayıtları geçerli bir değere güncelle
-- email olanlar email kalsın, diğerleri app olsun
UPDATE notifications
SET notification_type = CASE
  WHEN notification_type = 'email' THEN 'email'
  ELSE 'app'
END
WHERE notification_type IS NOT NULL;

-- NULL olanları app yap
UPDATE notifications
SET notification_type = 'app'
WHERE notification_type IS NULL;

-- ADIM 4: Güncelleme sonrası kontrol
SELECT
  'Güncellemeden sonra:' as info,
  notification_type,
  COUNT(*) as count
FROM notifications
GROUP BY notification_type;

-- ADIM 5: Şimdi constraint'i ekle
ALTER TABLE notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (notification_type IN ('app', 'email', 'app_reminder', 'app_overdue'));

-- ADIM 6: Başarı mesajı
SELECT 'Constraint başarıyla eklendi! Artık app_reminder ve app_overdue değerleri kullanılabilir.' as sonuc;
