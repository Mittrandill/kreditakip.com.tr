-- notification_type check constraint'i güncelle
-- Yeni tipler: app_reminder, app_overdue, email

-- 1. Önce mevcut constraint'i kontrol et
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND contype = 'c'
  AND conname LIKE '%notification_type%';

-- 2. Eski constraint'i kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- 3. Yeni constraint ekle - app_reminder, app_overdue, email, app değerlerini kabul et
ALTER TABLE notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (notification_type IN ('app', 'email', 'app_reminder', 'app_overdue'));

-- 4. Doğrulama
SELECT
  'Başarılı! Constraint güncellendi.' as sonuc,
  COUNT(*) as toplam_bildirim,
  COUNT(CASE WHEN notification_type = 'app' THEN 1 END) as app,
  COUNT(CASE WHEN notification_type = 'email' THEN 1 END) as email,
  COUNT(CASE WHEN notification_type = 'app_reminder' THEN 1 END) as app_reminder,
  COUNT(CASE WHEN notification_type = 'app_overdue' THEN 1 END) as app_overdue
FROM notifications
WHERE deleted_at IS NULL;

COMMENT ON CONSTRAINT notifications_notification_type_check ON notifications IS
  'Allowed types: app (legacy), email, app_reminder, app_overdue';
