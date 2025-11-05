-- Soft delete için deleted_at kolonu ekle
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Mevcut constraint'i kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS unique_user_payment_plan;

-- Yeni unique index ekle - sadece silinmemiş kayıtlar için
-- Bu sayede aynı payment_plan için silinen ve aktif bildirim birlikte olabilir
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_payment_plan_active
ON notifications (user_id, payment_plan_id)
WHERE deleted_at IS NULL AND payment_plan_id IS NOT NULL;

-- Açıklama ekle
COMMENT ON COLUMN notifications.deleted_at IS 'Soft delete için - NULL ise aktif, dolu ise silinmiş';
COMMENT ON INDEX unique_user_payment_plan_active IS 'Her kullanıcı için her payment_plan için sadece 1 aktif bildirim';
