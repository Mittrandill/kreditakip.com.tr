-- Soft delete için deleted_at kolonu ekle
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Unique constraint'i güncelle - silinmiş kayıtlar unique kontrolünden muaf
-- Önce eski constraint'i kaldır
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS unique_user_payment_plan;

-- Yeni constraint ekle - sadece silinmemiş kayıtlar için unique olsun
-- deleted_at NULL olanlar için unique kontrolü yap
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_payment_plan_not_deleted
ON notifications (user_id, payment_plan_id)
WHERE deleted_at IS NULL AND payment_plan_id IS NOT NULL;

-- Index açıklama ekle
COMMENT ON INDEX unique_user_payment_plan_not_deleted IS
'Her kullanıcı için her payment_plan sadece 1 aktif (silinmemiş) bildirime sahip olabilir';
