-- =============================================
-- Migrasyon: 20260112000001_drop_deprecated_usage_tracking.sql
-- Amaç: Kullanımdan kaldırılan usage_tracking tablosunun final olarak silinmesi
-- Tarih: 12 Ocak 2026 (planlanan)
-- Yazar: AI Audit
--
-- ⚠️  KRİTİK UYARI: Bu migrasyonu çalıştırmadan ÖNCE:
--
-- 1. 14 günlük gözlem periyodunun tamamlandığından emin olun
-- 2. Bu süre zarfında SIFIR sorun yaşandığından emin olun
-- 3. subscription_usage'ın mükemmel çalıştığını doğrulayın
-- 4. Hata loglarını kapsamlı inceleyin
-- 5. Aşağıdaki doğrulama sorgularını çalıştırın
--
-- GERİ DÖNÜŞ YOK: Bu migrasyon tabloyu tamamen siler!
-- (Yedek: usage_tracking_final_backup tablosunda kalıcı olarak korunur)
-- =============================================

-- =============================================================================
-- GÜVENLİK KONTROLLERİ
-- =============================================================================

DO $$
DECLARE
  scheduled_drop DATE;
  deprecation_days INTEGER;
  is_ready BOOLEAN;
  deprecation_status VARCHAR;
  has_errors BOOLEAN := false;
BEGIN
  -- Kullanımdan kaldırma kaydını getir
  SELECT
    scheduled_drop_date::DATE,
    status,
    EXTRACT(DAY FROM NOW() - deprecated_at)::INTEGER
  INTO scheduled_drop, deprecation_status, deprecation_days
  FROM schema_deprecation_log
  WHERE table_name = 'usage_tracking';

  -- Kayıt yoksa dur
  IF scheduled_drop IS NULL THEN
    RAISE EXCEPTION
      '❌ HATA: schema_deprecation_log''da usage_tracking kaydı bulunamadı! ' ||
      'Önce 20251229000002 migrasyonunu çalıştırmalısınız.';
  END IF;

  -- Tarih kontrolü
  is_ready := (NOW()::DATE >= scheduled_drop);

  IF NOT is_ready THEN
    RAISE EXCEPTION
      '❌ DURDUR! Gözlem periyodu henüz tamamlanmadı.%%' ||
      'Planlanan silme tarihi: %% (% gün kaldı)',
      scheduled_drop,
      (scheduled_drop - NOW()::DATE);
  END IF;

  -- Durum kontrolü
  IF deprecation_status != 'deprecated' THEN
    RAISE EXCEPTION
      '❌ DURDUR! Tablo durumu beklenmedik: %. ' ||
      'Devam etmeden önce durumu inceleyin.',
      deprecation_status;
  END IF;

  -- Yedek kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'usage_tracking_final_backup'
  ) THEN
    RAISE EXCEPTION
      '❌ HATA: usage_tracking_final_backup tablosu bulunamadı! ' ||
      'Yedek olmadan silme yapılamaz.';
  END IF;

  -- Başarı mesajı
  RAISE NOTICE '✅ Güvenlik kontrolleri geçti';
  RAISE NOTICE '   • Gözlem periyodu: % gün (minimum 14)', deprecation_days;
  RAISE NOTICE '   • Planlanan tarih: %', scheduled_drop;
  RAISE NOTICE '   • Yedek tablosu: Mevcut';
  RAISE NOTICE '   • Devam ediliyor...';
END $$;

-- =============================================================================
-- SON İSTATİSTİKLER
-- =============================================================================

DO $$
DECLARE
  old_table_count INTEGER;
  backup_count INTEGER;
  new_table_count INTEGER;
BEGIN
  -- Son kayıt sayıları
  SELECT COUNT(*) INTO old_table_count
  FROM _deprecated_usage_tracking_20251229;

  SELECT COUNT(*) INTO backup_count
  FROM usage_tracking_final_backup;

  SELECT COUNT(*) INTO new_table_count
  FROM subscription_usage;

  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  FİNAL İSTATİSTİKLER (Silme Öncesi)                      ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  _deprecated_usage_tracking_20251229: % kayıt             ║', old_table_count;
  RAISE NOTICE '║  usage_tracking_final_backup: % kayıt                     ║', backup_count;
  RAISE NOTICE '║  subscription_usage: % kayıt                              ║', new_table_count;
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';

  -- Yedek doğrulaması
  IF backup_count != old_table_count THEN
    RAISE WARNING
      '⚠️  Yedek kayıt sayısı farklı! Yedek: %, Tablo: %. ' ||
      'Devam etmek istediğinizden emin misiniz?',
      backup_count, old_table_count;
  END IF;
END $$;

-- =============================================================================
-- SİLME İŞLEMLERİ
-- =============================================================================

-- Adım 1: Tetikleyici ve fonksiyonu sil
RAISE NOTICE 'Senkronizasyon tetikleyicisi siliniyor...';

DROP TRIGGER IF EXISTS trigger_sync_usage_tracking
  ON _deprecated_usage_tracking_20251229;

DROP FUNCTION IF EXISTS sync_usage_tracking_to_subscription_usage();

RAISE NOTICE '✅ Tetikleyici ve fonksiyon silindi';

-- Adım 2: View'ı sil (varsa)
RAISE NOTICE 'Erişim uyarı view''ı siliniyor...';

DROP VIEW IF EXISTS usage_tracking_access_attempts;

RAISE NOTICE '✅ View silindi';

-- Adım 3: Kullanımdan kaldırılan tabloyu sil
RAISE NOTICE 'Kullanımdan kaldırılan tablo siliniyor...';

DROP TABLE IF EXISTS _deprecated_usage_tracking_20251229 CASCADE;

RAISE NOTICE '✅ _deprecated_usage_tracking_20251229 tablosu silindi';

-- =============================================================================
-- LOGLARı GÜNCELLE
-- =============================================================================

-- Kullanımdan kaldırma logunu güncelle
UPDATE schema_deprecation_log
SET
  status = 'dropped',
  actual_drop_date = NOW(),
  notes = notes || E'\n\n' ||
    'Tablo başarıyla silindi: ' || NOW()::TEXT || E'\n' ||
    'Kalıcı yedek: usage_tracking_final_backup tablosunda',
  updated_at = NOW()
WHERE table_name = 'usage_tracking';

-- =============================================================================
-- YEDEĞİ KORUMA ALTINA AL
-- =============================================================================

-- Yedek tablosunu kalıcı olarak işaretle
COMMENT ON TABLE usage_tracking_final_backup IS
  '🔒 KALİCİ YEDEK - SİLMEYİN! 🔒' || E'\n\n' ||
  'Bu tablo usage_tracking''in 29 Aralık 2025 tarihli son yedeğidir.' || E'\n' ||
  'subscription_usage''a geçişten önceki orijinal verileri içerir.' || E'\n\n' ||
  'Denetim izi ve uyumluluk için kalıcı olarak saklanmalıdır.' || E'\n' ||
  'Orijinal tablo 12 Ocak 2026 tarihinde silindi.' || E'\n\n' ||
  'Eğer bu yedeğe ihtiyaç duyarsanız:' || E'\n' ||
  '1. Veritabanı yöneticisine danışın' || E'\n' ||
  '2. Geri yükleme prosedürünü inceleyin' || E'\n' ||
  '3. subscription_usage ile karşılaştırın' || E'\n\n' ||
  'ÖNEMLI: Bu tabloyu silmek yasal denetim sorunlarına neden olabilir!';

-- Yedek tabloyu salt okunur yap (RLS ile)
ALTER TABLE usage_tracking_final_backup ENABLE ROW LEVEL SECURITY;

-- Sadece admin okuyabilir
CREATE POLICY "Sadece adminler yedeği görüntüleyebilir"
  ON usage_tracking_final_backup FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

RAISE NOTICE '✅ Yedek tablosu koruma altına alındı';

-- =============================================================================
-- TEMİZLİK VE DOĞRULAMA
-- =============================================================================

DO $$
DECLARE
  old_table_exists BOOLEAN;
  backup_exists BOOLEAN;
  backup_count INTEGER;
  log_status VARCHAR;
BEGIN
  -- Eski tablonun silindiğini doğrula
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name IN ('usage_tracking', '_deprecated_usage_tracking_20251229')
  ) INTO old_table_exists;

  -- Yedeğin var olduğunu doğrula
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'usage_tracking_final_backup'
  ) INTO backup_exists;

  -- Yedek kayıt sayısı
  SELECT COUNT(*) INTO backup_count FROM usage_tracking_final_backup;

  -- Log durumu
  SELECT status INTO log_status
  FROM schema_deprecation_log
  WHERE table_name = 'usage_tracking';

  -- Kontroller
  IF old_table_exists THEN
    RAISE EXCEPTION
      '❌ HATA: Eski tablo hala mevcut! Silme işlemi başarısız.';
  END IF;

  IF NOT backup_exists THEN
    RAISE EXCEPTION
      '❌ KRİTİK: Yedek tablosu bulunamadı! ' ||
      'Acil durumda veritabanı yöneticisine danışın!';
  END IF;

  IF backup_count = 0 THEN
    RAISE EXCEPTION
      '❌ KRİTİK: Yedek tablosu boş! ' ||
      'Veriler kaybolmuş olabilir, acil müdahale gerekli!';
  END IF;

  IF log_status != 'dropped' THEN
    RAISE WARNING
      '⚠️  Log durumu beklenmedik: %. Manuel kontrol önerilir.',
      log_status;
  END IF;

  -- Başarı raporu
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ MİGRASYON BAŞARIYLA TAMAMLANDI!                       ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  KALDIRlLAN:                                              ║';
  RAISE NOTICE '║    ✓ _deprecated_usage_tracking_20251229 (tablo)         ║';
  RAISE NOTICE '║    ✓ trigger_sync_usage_tracking (tetikleyici)           ║';
  RAISE NOTICE '║    ✓ sync_usage_tracking_to_subscription_usage (fonk)    ║';
  RAISE NOTICE '║    ✓ usage_tracking_access_attempts (view)               ║';
  RAISE NOTICE '║                                                           ║';
  RAISE NOTICE '║  KORUNAN:                                                 ║';
  RAISE NOTICE '║    🔒 usage_tracking_final_backup (% kayıt)               ║', backup_count;
  RAISE NOTICE '║    🔒 schema_deprecation_log (denetim kaydı)             ║';
  RAISE NOTICE '║                                                           ║';
  RAISE NOTICE '║  AKTİF SİSTEM:                                            ║';
  RAISE NOTICE '║    ✓ subscription_usage (yeni standart)                  ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  SONRAKI ADIMLAR:                                         ║';
  RAISE NOTICE '║  1. ✅ Uygulama loglarını kontrol edin                    ║';
  RAISE NOTICE '║  2. ✅ Abonelik işlemlerini test edin                     ║';
  RAISE NOTICE '║  3. ✅ Kullanım takibini doğrulayın                       ║';
  RAISE NOTICE '║  4. ✅ Yedek tablosunu arşivleyin (isteğe bağlı)          ║';
  RAISE NOTICE '║  5. ✅ Bu migrasyonu git''e commit edin                   ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  🎉 GEÇİŞ TAMAMLANDI!                                     ║';
  RAISE NOTICE '║  Artık sadece subscription_usage kullanılıyor.           ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
END $$;

-- =============================================================================
-- ACİL DURUM GERİ YÜKLEME NOTLARI
-- =============================================================================
--
-- ⚠️  BU MİGRASYON GERİ ALINMAZ!
--
-- Ancak acil durumda yedeğe erişebilirsiniz:
--
-- -- Yedeği görüntüle
-- SELECT * FROM usage_tracking_final_backup;
--
-- -- Gerekirse geçici tablo oluştur
-- CREATE TABLE usage_tracking_restored AS
-- SELECT * FROM usage_tracking_final_backup;
--
-- -- Ancak uygulamanın artık subscription_usage kullandığını unutmayın!
-- -- Eski veriyi geri yüklemek YENİ uygulamayla çalışmayacaktır.
--
-- =============================================================================

-- Migration final marker
SELECT 'usage_tracking migrasyonu başarıyla tamamlandı! ✅' AS result;
