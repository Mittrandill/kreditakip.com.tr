-- Email workflow ile uyumlu hale getir
-- notification_category yerine notification_type kullan

-- 1. notification_category kolonunu kaldır (eğer eklenmişse)
ALTER TABLE notifications
DROP COLUMN IF EXISTS notification_category;

-- 2. notification_type kolonu zaten var mı kontrol et, yoksa ekle
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'app';

-- 3. Mevcut unique index'i kaldır
DROP INDEX IF EXISTS unique_user_payment_plan_category_active;
DROP INDEX IF EXISTS unique_user_payment_plan_active;

-- 4. Yeni unique constraint ekle - notification_type bazında
-- Her payment_plan için her type'ta (app, email) sadece 1 aktif bildirim olabilir
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_payment_plan_type_active
ON notifications (user_id, payment_plan_id, notification_type)
WHERE deleted_at IS NULL AND payment_plan_id IS NOT NULL;

-- 5. Mevcut kayıtları güncelle - app bildirimleri olarak işaretle
UPDATE notifications
SET notification_type = 'app'
WHERE notification_type IS NULL OR notification_type = 'reminder';

-- 6. Doğrulama
SELECT
  'Başarılı! Email workflow uyumlu hale getirildi.' as sonuc,
  COUNT(*) as toplam_bildirim,
  COUNT(CASE WHEN notification_type = 'app' THEN 1 END) as app_bildirimleri,
  COUNT(CASE WHEN notification_type = 'email' THEN 1 END) as email_bildirimleri
FROM notifications
WHERE deleted_at IS NULL;

COMMENT ON COLUMN notifications.notification_type IS
  'Bildirim tipi: app (uygulama içi), email (email bildirimi)';
COMMENT ON INDEX unique_user_payment_plan_type_active IS
  'Her payment_plan için her type bazında 1 aktif bildirim (email workflow uyumlu)';
