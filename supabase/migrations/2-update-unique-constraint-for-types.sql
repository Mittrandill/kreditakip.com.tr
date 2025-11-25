-- Unique constraint'i güncelle: aynı payment_plan için farklı type'larda bildirim olabilsin
-- Örnek: Aynı ödeme için hem "warning" (hatırlatma) hem "error" (gecikme) olabilir

-- 1. Önce mevcut unique index'i kaldır
DROP INDEX IF EXISTS unique_user_payment_plan_active;

-- 2. Yeni unique index ekle - notification_category bazında
-- notification_category değerleri:
--   - "reminder": Yaklaşan ödemeler için hatırlatma (3 gün önceden)
--   - "overdue": Geciken ödemeler için uyarı (vade tarihinden sonra)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS notification_category VARCHAR(50) DEFAULT 'reminder';

-- 3. Mevcut kayıtları güncelle - hepsini "reminder" yap
UPDATE notifications
SET notification_category = 'reminder'
WHERE notification_category IS NULL;

-- 4. Yeni unique constraint ekle
-- Her payment_plan için her category'de sadece 1 aktif bildirim olabilir
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_payment_plan_category_active
ON notifications (user_id, payment_plan_id, notification_category)
WHERE deleted_at IS NULL AND payment_plan_id IS NOT NULL;

-- 5. Doğrulama
SELECT
  'Başarılı! Unique constraint güncellendi.' as sonuc,
  COUNT(*) as toplam_bildirim,
  COUNT(DISTINCT (user_id, payment_plan_id)) as unique_payment_plan,
  COUNT(DISTINCT (user_id, payment_plan_id, notification_category)) as unique_payment_plan_category
FROM notifications
WHERE deleted_at IS NULL;

COMMENT ON COLUMN notifications.notification_category IS
  'Bildirim kategorisi: reminder (hatırlatma), overdue (gecikme)';
COMMENT ON INDEX unique_user_payment_plan_category_active IS
  'Her payment_plan için her category bazında 1 aktif bildirim';
