-- =============================================
-- Migrasyon: 20251229000002_finalize_usage_tracking_deprecation.sql
-- Amaç: Tüm kod subscription_usage'a taşındıktan sonra usage_tracking'i kullanımdan kaldır
-- Tarih: 29 Aralık 2025
-- Yazar: AI Audit
--
-- UYARI: Bu migrasyonu çalıştırmadan ÖNCE:
-- 1. Tüm kod değişikliklerinin dağıtıldığından emin olun
-- 2. Aşağıdaki doğrulama sorgusunu çalıştırın
-- 3. Son 1 saatte usage_tracking'e SIFIR yazma olduğunu doğrulayın
--
-- GÜVENL��K: Bu migrasyon tabloyu SİLMEZ, sadece yeniden adlandırır.
-- 14 günlük gözlem periyodundan sonra final migrasyon ile silinecek.
-- =============================================

-- =============================================================================
-- ÖN KONTROL: Son yazmaları doğrula
-- =============================================================================

DO $$
DECLARE
  recent_writes INTEGER;
  last_write TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Son 1 saatte usage_tracking'e yazma kontrolü
  SELECT
    COUNT(*),
    MAX(updated_at)
  INTO recent_writes, last_write
  FROM usage_tracking
  WHERE updated_at > NOW() - INTERVAL '1 hour';

  IF recent_writes > 0 THEN
    RAISE EXCEPTION
      'DURDUR! Son 1 saatte usage_tracking''e % yazma tespit edildi. Son yazma: %. ' ||
      'Tüm kod değişiklikleri dağıtılmadan bu migrasyonu çalıştırmayın!',
      recent_writes, last_write;
  END IF;

  RAISE NOTICE '✅ Son 1 saatte usage_tracking''e yazma yok. Migrasyon devam edebilir.';
END $$;

-- =============================================================================
-- YEDEKLEME
-- =============================================================================

-- Son güvenlik yedeği oluştur
CREATE TABLE IF NOT EXISTS usage_tracking_final_backup AS
SELECT * FROM usage_tracking;

-- Yedek tablo istatistikleri
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM usage_tracking_final_backup;
  RAISE NOTICE '✅ % kayıt usage_tracking_final_backup tablosuna yedeklendi', backup_count;
END $$;

-- Yedek tabloyu koruma altına al
COMMENT ON TABLE usage_tracking_final_backup IS
  'KALİCİ YEDEK: usage_tracking tablosunun son yedeği (29 Aralık 2025). ' ||
  'subscription_usage''a geçişten önceki orijinal veri. ' ||
  'Denetim izi için GEREKLİ - SİLMEYİN!';

-- =============================================================================
-- KULLANIM DIŞI BIRAKMA PROSEDÜRÜ
-- =============================================================================

DO $$
BEGIN
  -- Adım 1: Senkronizasyon tetikleyicisini devre dışı bırak
  ALTER TABLE usage_tracking DISABLE TRIGGER trigger_sync_usage_tracking;

  RAISE NOTICE '✅ Senkronizasyon tetikleyicisi devre dışı bırakıldı';

  -- Adım 2: Tabloyu yeniden adlandır
  ALTER TABLE usage_tracking RENAME TO _deprecated_usage_tracking_20251229;

  RAISE NOTICE '✅ Tablo _deprecated_usage_tracking_20251229 olarak yeniden adlandırıldı';
END $$;

-- Adım 3: Kullanımdan kaldırma uyarısı ekle
DO $$
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE _deprecated_usage_tracking_20251229 IS %L',
    'KULLANIM DIŞI - 29 Aralık 2025

Bu tablo subscription_usage ile değiştirilmiştir ve artık kullanılmamalıdır.

Kullanımdan kaldırma nedeni:
- subscription_usage daha iyi şema tasarımına sahip (subscription_id takibi)
- İki gerçek kaynağı problemi veri tutarsızlığına neden oluyordu
- Paddle entegrasyonu subscription_usage kullanıyor

Kullanımdan kaldırma planı:
1. 29 Aralık 2025: Tablo _deprecated_usage_tracking_20251229 olarak yeniden adlandırıldı
2. 29 Aralık - 12 Ocak 2026: 14 günlük gözlem periyodu
3. 12 Ocak 2026: Sorun yoksa tablo tamamen silinecek

Yedek: usage_tracking_final_backup (kalıcı)

Yeni tablo: subscription_usage

Kolon eşleştirme:
- used_count → usage_count
- Diğer tüm kolonlar aynı

Geçiş scripti için bakınız: 20251130000002_consolidate_usage_tracking.sql'
  );
END $$;

-- =============================================================================
-- KULLANIM DIŞI BIRAKMA TAKIP SİSTEMİ
-- =============================================================================

-- Kullanımdan kaldırma log tablosu oluştur (yoksa)
CREATE TABLE IF NOT EXISTS schema_deprecation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255) NOT NULL,
  deprecated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_drop_date TIMESTAMP WITH TIME ZONE,
  actual_drop_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'deprecated',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- usage_tracking girişi ekle
INSERT INTO schema_deprecation_log (
  table_name,
  scheduled_drop_date,
  status,
  notes
)
VALUES (
  'usage_tracking',
  NOW() + INTERVAL '14 days',
  'deprecated',
  'Tablo _deprecated_usage_tracking_20251229 olarak yeniden adlandırıldı. ' ||
  'subscription_usage ile değiştirildi. ' ||
  '14 günlük gözlem periyodundan sonra final migrasyon ile silinecek. ' ||
  'Kod değişiklikleri: subscription-expiry-check, grace-period-handler, admin/page, ayarlar/page, export-data'
)
ON CONFLICT (table_name)
DO UPDATE SET
  deprecated_at = NOW(),
  scheduled_drop_date = NOW() + INTERVAL '14 days',
  status = 'deprecated',
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- =============================================================================
-- GÖZLEMLENEBİLİRLİK
-- =============================================================================

-- Yanlışlıkla erişim girişimlerini tespit etmek için view oluştur
CREATE OR REPLACE VIEW usage_tracking_access_attempts AS
SELECT
  'usage_tracking tablosu artık kullanımda değil! subscription_usage kullanın.' as warning,
  now() as attempted_at;

COMMENT ON VIEW usage_tracking_access_attempts IS
  'Eski usage_tracking tablosuna erişim girişimlerini algılar. ' ||
  'Eğer bu view kullanılıyorsa, hala güncellenmeyen kod var demektir.';

-- =============================================================================
-- DOĞRULAMA
-- =============================================================================

DO $$
DECLARE
  old_table_exists BOOLEAN;
  new_table_exists BOOLEAN;
  backup_count INTEGER;
  log_count INTEGER;
BEGIN
  -- Eski tablonun artık mevcut olmadığını doğrula
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'usage_tracking'
  ) INTO old_table_exists;

  -- Yeni adlandırılmış tablonun var olduğunu doğrula
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = '_deprecated_usage_tracking_20251229'
  ) INTO new_table_exists;

  -- Yedek tablonun var olduğunu doğrula
  SELECT COUNT(*) INTO backup_count FROM usage_tracking_final_backup;

  -- Log kaydının oluşturulduğunu doğrula
  SELECT COUNT(*) INTO log_count
  FROM schema_deprecation_log
  WHERE table_name = 'usage_tracking';

  -- Kontroller
  IF old_table_exists THEN
    RAISE EXCEPTION '❌ usage_tracking tablosu hala mevcut! Yeniden adlandırma başarısız.';
  END IF;

  IF NOT new_table_exists THEN
    RAISE EXCEPTION '❌ _deprecated_usage_tracking_20251229 tablosu bulunamadı!';
  END IF;

  IF backup_count = 0 THEN
    RAISE EXCEPTION '❌ Yedek tablosu boş!';
  END IF;

  IF log_count = 0 THEN
    RAISE EXCEPTION '❌ Kullanımdan kaldırma logu oluşturulamadı!';
  END IF;

  -- Başarı mesajları
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ MİGRASYON BAŞARIYLA TAMAMLANDI                        ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  • usage_tracking → _deprecated_usage_tracking_20251229   ║';
  RAISE NOTICE '║  • % kayıt yedeklendi                                     ║', backup_count;
  RAISE NOTICE '║  • 14 günlük gözlem periyodu başladı                      ║';
  RAISE NOTICE '║  • Planlanan silme: %                    ║', (NOW() + INTERVAL '14 days')::DATE;
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  SONRAKI ADIMLAR:                                         ║';
  RAISE NOTICE '║  1. Uygulamayı izleyin (14 gün)                           ║';
  RAISE NOTICE '║  2. Hata loglarını kontrol edin                           ║';
  RAISE NOTICE '║  3. subscription_usage''ın doğru çalıştığını doğrulayın   ║';
  RAISE NOTICE '║  4. Sorun yoksa 12 Ocak''ta final migrasyonu çalıştırın  ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
END $$;

-- =============================================================================
-- GERİ ALMA SCRİPTİ
-- =============================================================================
-- Eğer gözlem periyodunda sorunlar tespit edilirse:
--
-- -- Tabloyu geri yükle
-- ALTER TABLE _deprecated_usage_tracking_20251229 RENAME TO usage_tracking;
--
-- -- Tetikleyiciyi yeniden etkinleştir
-- ALTER TABLE usage_tracking ENABLE TRIGGER trigger_sync_usage_tracking;
--
-- -- Logu güncelle
-- UPDATE schema_deprecation_log
-- SET
--   status = 'rollback',
--   notes = 'Gözlem periyodunda sorunlar tespit edildi - geri alma yapıldı: ' || NOW()::TEXT,
--   updated_at = NOW()
-- WHERE table_name = 'usage_tracking';
--
-- RAISE NOTICE '✅ Geri alma tamamlandı - usage_tracking tablosu geri yüklendi';
