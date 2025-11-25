-- İyzico Tekrarlayan Ödeme Sistemi için Veritabanı Tabloları

-- 1. Pending Subscriptions Tablosu (Ödeme tamamlanmadan önce)
CREATE TABLE IF NOT EXISTS public.pending_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  plan_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  conversation_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  subscription_reference TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Webhook Logs Tablosu (İyzico'dan gelen bildirimleri kaydetmek için)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  subscription_reference TEXT,
  payload JSONB,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Subscriptions tablosuna yeni kolonlar ekle (eğer yoksa)
DO $$
BEGIN
  -- iyzico_subscription_reference kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'iyzico_subscription_reference'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD COLUMN iyzico_subscription_reference TEXT;
  END IF;

  -- start_date kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- end_date kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- plan_id kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD COLUMN plan_id TEXT;
  END IF;
END $$;

-- 4. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_user_id ON public.pending_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_token ON public.pending_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_status ON public.pending_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_ref ON public.webhook_logs(subscription_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_reference ON public.subscriptions(iyzico_subscription_reference);

-- 5. RLS Politikaları (Row Level Security)

-- pending_subscriptions için RLS
ALTER TABLE public.pending_subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi pending subscription'larını görebilir
CREATE POLICY "Users can view own pending subscriptions"
  ON public.pending_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi pending subscription'larını ekleyebilir
CREATE POLICY "Users can insert own pending subscriptions"
  ON public.pending_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- webhook_logs için RLS (sadece servis erişebilir)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Sadece authenticated users webhook logları görebilir (admin için)
CREATE POLICY "Authenticated users can view webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. Updated_at trigger için function (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Pending subscriptions için updated_at trigger
DROP TRIGGER IF EXISTS update_pending_subscriptions_updated_at ON public.pending_subscriptions;
CREATE TRIGGER update_pending_subscriptions_updated_at
  BEFORE UPDATE ON public.pending_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Webhook logs için updated_at kolonu ve trigger (eğer gerekirse)
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_webhook_logs_updated_at ON public.webhook_logs;
CREATE TRIGGER update_webhook_logs_updated_at
  BEFORE UPDATE ON public.webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Eski pending subscription kayıtlarını temizleme fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_old_pending_subscriptions()
RETURNS void AS $$
BEGIN
  -- 7 günden eski completed veya failed kayıtları sil
  DELETE FROM public.pending_subscriptions
  WHERE
    status IN ('completed', 'failed')
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Webhook loglarını temizleme fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  -- 30 günden eski webhook loglarını sil
  DELETE FROM public.webhook_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Subscription durumu kontrol fonksiyonu
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id UUID)
RETURNS TABLE (
  is_active BOOLEAN,
  plan_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (s.status = 'active' AND s.expires_at > NOW()) as is_active,
    s.plan_type,
    s.expires_at,
    EXTRACT(DAY FROM (s.expires_at - NOW()))::INTEGER as days_remaining
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İndeks açıklamaları
COMMENT ON TABLE public.pending_subscriptions IS 'Checkout tamamlanmadan önce geçici subscription kayıtları';
COMMENT ON TABLE public.webhook_logs IS 'İyzico webhook bildirimlerinin logları';
COMMENT ON COLUMN public.subscriptions.iyzico_subscription_reference IS 'İyzico subscription reference code (otomatik ödemeler için)';
COMMENT ON FUNCTION cleanup_old_pending_subscriptions() IS '7 günden eski completed/failed pending subscriptions kayıtlarını temizler';
COMMENT ON FUNCTION cleanup_old_webhook_logs() IS '30 günden eski webhook loglarını temizler';
COMMENT ON FUNCTION check_subscription_status(UUID) IS 'Kullanıcının subscription durumunu kontrol eder';
