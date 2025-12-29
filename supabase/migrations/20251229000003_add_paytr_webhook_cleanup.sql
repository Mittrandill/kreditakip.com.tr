-- =============================================
-- Migrasyon: 20251229000003_add_paytr_webhook_cleanup.sql
-- Amaç: PayTR ve Paddle webhook tabloları için otomatik temizlik sistemi ekle
-- Tarih: 29 Aralık 2025
-- Yazar: AI Audit
--
-- Veritabanı şişmesini önlemek için eski webhook kayıtlarını otomatik siler.
-- 90 günden eski ve işlenmiş webhook'lar silinir.
-- =============================================

-- =============================================================================
-- TEMİZLİK JOB TAKİP TABLOSU
-- =============================================================================

-- Temizlik job'larını takip etmek için tablo oluştur
CREATE TABLE IF NOT EXISTS cleanup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(255) NOT NULL UNIQUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  records_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tablo açıklaması
COMMENT ON TABLE cleanup_jobs IS 'Otomatik veritabanı temizlik job''larının takibi. Webhook temizliği, log temizliği vb.';

-- Sütun açıklamaları
COMMENT ON COLUMN cleanup_jobs.job_name IS 'Temizlik job''ının benzersiz adı';
COMMENT ON COLUMN cleanup_jobs.last_run_at IS 'Job''ın en son çalıştığı zaman';
COMMENT ON COLUMN cleanup_jobs.next_run_at IS 'Job''ın bir sonraki çalışma zamanı';
COMMENT ON COLUMN cleanup_jobs.records_deleted IS 'En son çalıştırmada silinen kayıt sayısı';

-- İndeks oluştur
CREATE INDEX idx_cleanup_jobs_next_run ON cleanup_jobs(next_run_at)
  WHERE status = 'pending';

COMMENT ON INDEX idx_cleanup_jobs_next_run IS 'Zamanlanmış job''ları hızlı bulmak için';

-- =============================================================================
-- PAYTR WEBHOOK TEMİZLİĞİ
-- =============================================================================

-- PayTR webhook'ları için verimli temizlik indeksi
CREATE INDEX IF NOT EXISTS idx_paytr_webhooks_cleanup
  ON paytr_webhook_events(created_at, processed)
  WHERE processed = TRUE;

COMMENT ON INDEX idx_paytr_webhooks_cleanup IS
  'Eski işlenmiş PayTR webhook''larının temizliğini optimize eder. ' ||
  '90+ gün önceki processed=true kayıtları hızlı bulur.';

-- PayTR webhook temizlik fonksiyonu (geliştirilmiş versiyon)
CREATE OR REPLACE FUNCTION cleanup_old_paytr_webhooks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 90;
BEGIN
  -- 90 günden eski işlenmiş webhook'ları sil
  DELETE FROM paytr_webhook_events
  WHERE created_at < NOW() - MAKE_INTERVAL(days => retention_days)
    AND processed = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Cleanup job kaydını güncelle
  INSERT INTO cleanup_jobs (
    job_name,
    last_run_at,
    next_run_at,
    status,
    records_deleted,
    updated_at
  )
  VALUES (
    'paytr_webhook_cleanup',
    NOW(),
    NOW() + INTERVAL '7 days',
    'completed',
    deleted_count,
    NOW()
  )
  ON CONFLICT (job_name)
  DO UPDATE SET
    last_run_at = NOW(),
    next_run_at = NOW() + INTERVAL '7 days',
    status = 'completed',
    records_deleted = deleted_count,
    error_message = NULL,
    updated_at = NOW();

  -- Log mesajı
  RAISE NOTICE 'PayTR webhook temizliği: % kayıt silindi (% gün öncesi)',
    deleted_count, retention_days;

  RETURN deleted_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda logu güncelle
    UPDATE cleanup_jobs
    SET
      status = 'failed',
      error_message = SQLERRM,
      updated_at = NOW()
    WHERE job_name = 'paytr_webhook_cleanup';

    RAISE NOTICE 'PayTR webhook temizliği hatası: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon açıklaması
COMMENT ON FUNCTION cleanup_old_paytr_webhooks IS
  'PayTR webhook_events tablosundan 90 günden eski işlenmiş kayıtları otomatik siler. ' ||
  'Haftalık cron job olarak çalıştırılmalı. ' ||
  'Sadece processed=true olan kayıtları siler, işlenmemiş webhook''lar korunur.';

-- =============================================================================
-- PADDLE WEBHOOK TEMİZLİĞİ
-- =============================================================================

-- Paddle webhook'ları için verimli temizlik indeksi
CREATE INDEX IF NOT EXISTS idx_paddle_webhooks_cleanup
  ON paddle_webhook_events(created_at, processed)
  WHERE processed = TRUE;

COMMENT ON INDEX idx_paddle_webhooks_cleanup IS
  'Eski işlenmiş Paddle webhook''larının temizliğini optimize eder. ' ||
  '90+ gün önceki processed=true kayıtları hızlı bulur.';

-- Paddle webhook temizlik fonksiyonu (geliştirilmiş versiyon)
CREATE OR REPLACE FUNCTION cleanup_old_paddle_webhooks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 90;
BEGIN
  -- 90 günden eski işlenmiş webhook'ları sil
  DELETE FROM paddle_webhook_events
  WHERE created_at < NOW() - MAKE_INTERVAL(days => retention_days)
    AND processed = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Cleanup job kaydını güncelle
  INSERT INTO cleanup_jobs (
    job_name,
    last_run_at,
    next_run_at,
    status,
    records_deleted,
    updated_at
  )
  VALUES (
    'paddle_webhook_cleanup',
    NOW(),
    NOW() + INTERVAL '7 days',
    'completed',
    deleted_count,
    NOW()
  )
  ON CONFLICT (job_name)
  DO UPDATE SET
    last_run_at = NOW(),
    next_run_at = NOW() + INTERVAL '7 days',
    status = 'completed',
    records_deleted = deleted_count,
    error_message = NULL,
    updated_at = NOW();

  -- Log mesajı
  RAISE NOTICE 'Paddle webhook temizliği: % kayıt silindi (% gün öncesi)',
    deleted_count, retention_days;

  RETURN deleted_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda logu güncelle
    UPDATE cleanup_jobs
    SET
      status = 'failed',
      error_message = SQLERRM,
      updated_at = NOW()
    WHERE job_name = 'paddle_webhook_cleanup';

    RAISE NOTICE 'Paddle webhook temizliği hatası: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon açıklaması
COMMENT ON FUNCTION cleanup_old_paddle_webhooks IS
  'Paddle webhook_events tablosundan 90 günden eski işlenmiş kayıtları otomatik siler. ' ||
  'Haftalık cron job olarak çalıştırılmalı. ' ||
  'Sadece processed=true olan kayıtları siler, işlenmemiş webhook''lar korunur.';

-- =============================================================================
-- İLK ZAMANLAMA
-- =============================================================================

-- Cleanup job'ları için ilk kayıtları oluştur
INSERT INTO cleanup_jobs (job_name, next_run_at, status)
VALUES
  ('paytr_webhook_cleanup', NOW() + INTERVAL '7 days', 'pending'),
  ('paddle_webhook_cleanup', NOW() + INTERVAL '7 days', 'pending')
ON CONFLICT (job_name) DO NOTHING;

-- =============================================================================
-- İSTATİSTİKLER VE BİLGİLENDİRME
-- =============================================================================

-- Mevcut webhook istatistiklerini göster
DO $$
DECLARE
  paytr_total INTEGER;
  paytr_processed INTEGER;
  paytr_old INTEGER;
  paddle_total INTEGER;
  paddle_processed INTEGER;
  paddle_old INTEGER;
BEGIN
  -- PayTR istatistikleri
  SELECT COUNT(*) INTO paytr_total FROM paytr_webhook_events;
  SELECT COUNT(*) INTO paytr_processed FROM paytr_webhook_events WHERE processed = true;
  SELECT COUNT(*) INTO paytr_old
    FROM paytr_webhook_events
    WHERE created_at < NOW() - INTERVAL '90 days' AND processed = true;

  -- Paddle istatistikleri
  SELECT COUNT(*) INTO paddle_total FROM paddle_webhook_events;
  SELECT COUNT(*) INTO paddle_processed FROM paddle_webhook_events WHERE processed = true;
  SELECT COUNT(*) INTO paddle_old
    FROM paddle_webhook_events
    WHERE created_at < NOW() - INTERVAL '90 days' AND processed = true;

  -- Rapor
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ WEBHOOK TEMİZLİK SİSTEMİ KURULDU                      ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PayTR Webhook İstatistikleri:                           ║';
  RAISE NOTICE '║    • Toplam: % kayıt                                      ║', paytr_total;
  RAISE NOTICE '║    • İşlenmiş: % kayıt                                    ║', paytr_processed;
  RAISE NOTICE '║    • 90+ gün eski: % kayıt (silinebilir)                  ║', paytr_old;
  RAISE NOTICE '║                                                           ║';
  RAISE NOTICE '║  Paddle Webhook İstatistikleri:                          ║';
  RAISE NOTICE '║    • Toplam: % kayıt                                      ║', paddle_total;
  RAISE NOTICE '║    • İşlenmiş: % kayıt                                    ║', paddle_processed;
  RAISE NOTICE '║    • 90+ gün eski: % kayıt (silinebilir)                  ║', paddle_old;
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  TEMİZLİK AYARLARI:                                       ║';
  RAISE NOTICE '║    • Saklama süresi: 90 gün                               ║';
  RAISE NOTICE '║    • Çalışma sıklığı: Haftalık                            ║';
  RAISE NOTICE '║    • Sadece işlenmiş webhook''lar silinir                 ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  SONRAKI ADIMLAR:                                         ║';
  RAISE NOTICE '║  1. app/api/cron/webhook-cleanup/route.ts oluşturun       ║';
  RAISE NOTICE '║  2. vercel.json''a cron job ekleyin                       ║';
  RAISE NOTICE '║  3. Manuel test: SELECT cleanup_old_paytr_webhooks();     ║';
  RAISE NOTICE '║  4. Manuel test: SELECT cleanup_old_paddle_webhooks();    ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
END $$;

-- =============================================================================
-- TEST FONKSİYONU
-- =============================================================================

-- Manuel test için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION test_webhook_cleanup()
RETURNS TABLE (
  job_name VARCHAR,
  deleted_count INTEGER,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'paytr_webhook_cleanup'::VARCHAR,
    cleanup_old_paytr_webhooks(),
    'completed'::VARCHAR
  UNION ALL
  SELECT
    'paddle_webhook_cleanup'::VARCHAR,
    cleanup_old_paddle_webhooks(),
    'completed'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION test_webhook_cleanup IS
  'Test amaçlı tüm webhook temizlik fonksiyonlarını çalıştırır. ' ||
  'Kullanım: SELECT * FROM test_webhook_cleanup();';

-- =============================================================================
-- GERİ ALMA SCRİPTİ
-- =============================================================================
-- Bu migrasyonu geri almak için:
--
-- DROP FUNCTION IF EXISTS test_webhook_cleanup();
-- DROP FUNCTION IF EXISTS cleanup_old_paddle_webhooks();
-- DROP FUNCTION IF EXISTS cleanup_old_paytr_webhooks();
-- DROP INDEX IF EXISTS idx_paddle_webhooks_cleanup;
-- DROP INDEX IF EXISTS idx_paytr_webhooks_cleanup;
-- DROP TABLE IF EXISTS cleanup_jobs CASCADE;
