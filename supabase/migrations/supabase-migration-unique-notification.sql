-- Her kullanıcı için her payment_plan'a sadece 1 bildirim olmalı
-- Bu constraint duplicate bildirimleri önler

-- Önce mevcut duplicate kayıtları temizle (eğer varsa)
-- En eski olanı tut, diğerlerini sil
DELETE FROM notifications a USING notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.payment_plan_id = b.payment_plan_id
  AND a.payment_plan_id IS NOT NULL;

-- Unique constraint ekle
-- NOT NULL payment_plan_id'ler için sadece 1 kayıt olabilir
ALTER TABLE notifications
ADD CONSTRAINT unique_user_payment_plan
UNIQUE NULLS NOT DISTINCT (user_id, payment_plan_id);

-- NOT: NULLS NOT DISTINCT sayesinde payment_plan_id NULL olanlar etkilenmez
-- Sadece payment_plan_id dolu olanlar için unique constraint uygulanır
