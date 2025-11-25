-- 1. Önce mevcut constraint'i kontrol et
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'unique_user_payment_plan';

-- 2. Eğer constraint yoksa, önce duplicate'leri temizle
-- En YENİ kaydı tut (en büyük id), eskilerini sil
DELETE FROM notifications a
USING (
  SELECT
    user_id,
    payment_plan_id,
    MAX(id) as max_id
  FROM notifications
  WHERE payment_plan_id IS NOT NULL
  GROUP BY user_id, payment_plan_id
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
  AND a.payment_plan_id = b.payment_plan_id
  AND a.id < b.max_id;

-- 3. Unique constraint ekle (eğer yoksa)
ALTER TABLE notifications
ADD CONSTRAINT IF NOT EXISTS unique_user_payment_plan
UNIQUE (user_id, payment_plan_id);

-- 4. Constraint'in başarıyla eklendiğini doğrula
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'unique_user_payment_plan';
