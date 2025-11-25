-- Önce mevcut constraint'i tamamen kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Constraint olmadan mevcut değerleri kontrol et
SELECT
  notification_type,
  COUNT(*) as count
FROM notifications
GROUP BY notification_type
ORDER BY count DESC;

-- Yeni constraint'i ekle - app, email, app_reminder, app_overdue
ALTER TABLE notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (notification_type IN ('app', 'email', 'app_reminder', 'app_overdue'));

-- Constraint başarıyla eklendiğini doğrula
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_notification_type_check';

-- Son durum
SELECT
  'Başarılı! Yeni notification_type değerleri kabul ediliyor.' as sonuc,
  notification_type,
  COUNT(*) as count
FROM notifications
GROUP BY notification_type
ORDER BY count DESC;
