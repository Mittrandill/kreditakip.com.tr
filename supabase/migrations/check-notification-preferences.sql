-- Mevcut notification_preferences tablosu yapısını göster
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_preferences'
ORDER BY ordinal_position;
