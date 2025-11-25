-- Mevcut notification_type değerlerini kontrol et
SELECT
  notification_type,
  COUNT(*) as count
FROM notifications
GROUP BY notification_type
ORDER BY count DESC;

-- Boş veya geçersiz değerleri 'app' olarak güncelle
UPDATE notifications
SET notification_type = 'app'
WHERE notification_type IS NULL
   OR notification_type NOT IN ('app', 'email', 'app_reminder', 'app_overdue');

-- Constraint'i kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Yeni constraint ekle
ALTER TABLE notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (notification_type IN ('app', 'email', 'app_reminder', 'app_overdue'));

-- Doğrulama
SELECT
  'Başarılı! Constraint güncellendi.' as sonuc,
  notification_type,
  COUNT(*) as count
FROM notifications
WHERE deleted_at IS NULL
GROUP BY notification_type
ORDER BY count DESC;
