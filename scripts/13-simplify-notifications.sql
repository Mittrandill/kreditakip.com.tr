-- Notification tablosunu basitleştir
ALTER TABLE notifications 
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS scheduled_for;

-- Sadece gerekli alanları tut
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS payment_plan_id UUID REFERENCES payment_plans(id);

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_notifications_user_payment_plan 
ON notifications(user_id, payment_plan_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- Mevcut bildirimleri temizle
TRUNCATE TABLE notifications;
