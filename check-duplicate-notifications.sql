-- Duplicate bildirimleri kontrol et
SELECT
  user_id,
  payment_plan_id,
  COUNT(*) as bildirim_sayisi
FROM notifications
WHERE payment_plan_id IS NOT NULL
GROUP BY user_id, payment_plan_id
HAVING COUNT(*) > 1
ORDER BY bildirim_sayisi DESC;

-- Toplam duplicate sayısı
SELECT
  COUNT(*) as toplam_duplicate_grup,
  SUM(sayisi - 1) as silinecek_kayit_sayisi
FROM (
  SELECT
    user_id,
    payment_plan_id,
    COUNT(*) as sayisi
  FROM notifications
  WHERE payment_plan_id IS NOT NULL
  GROUP BY user_id, payment_plan_id
  HAVING COUNT(*) > 1
) as duplicates;
