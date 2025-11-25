-- ADIM 1: Önce deleted_at kolonunu ekle (eğer yoksa)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ADIM 2: Duplicate bildirimleri temizle - en YENİ olanı tut, eskilerini soft delete yap
-- Bu şekilde veri kaybı olmaz, eski kayıtlar soft delete edilir
WITH duplicates AS (
  SELECT
    id,
    user_id,
    payment_plan_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, payment_plan_id
      ORDER BY created_at DESC  -- En yeni kaydı tut
    ) as rn
  FROM notifications
  WHERE payment_plan_id IS NOT NULL
    AND deleted_at IS NULL
)
UPDATE notifications
SET deleted_at = NOW()
FROM duplicates
WHERE notifications.id = duplicates.id
  AND duplicates.rn > 1;

-- ADIM 3: Temizlik sonucunu kontrol et
SELECT
  COUNT(*) as kalan_duplicate_sayisi
FROM (
  SELECT
    user_id,
    payment_plan_id,
    COUNT(*) as sayisi
  FROM notifications
  WHERE payment_plan_id IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY user_id, payment_plan_id
  HAVING COUNT(*) > 1
) as remaining_duplicates;

-- ADIM 4: Eski constraint'i kaldır (eğer varsa)
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS unique_user_payment_plan;

-- ADIM 5: Yeni unique index'i oluştur - sadece aktif kayıtlar için
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_payment_plan_active
ON notifications (user_id, payment_plan_id)
WHERE deleted_at IS NULL AND payment_plan_id IS NOT NULL;

-- ADIM 6: Sonuçları doğrula
SELECT
  'Başarılı! Unique index oluşturuldu.' as sonuc,
  COUNT(*) as toplam_aktif_bildirim,
  COUNT(DISTINCT (user_id, payment_plan_id)) as unique_kullanici_payment_plan
FROM notifications
WHERE deleted_at IS NULL;
