-- =============================================
-- Migrasyon: 20251229000001_add_missing_tables.sql
-- Amaç: Risk analizinde referans verilen accounts ve credit_cards tablolarını oluştur
-- Tarih: 29 Aralık 2025
-- Yazar: AI Audit
--
-- UYARI: Bu migrasyon risk analizi özelliği için gerekli tabloları oluşturur.
-- Eğer bu özelliklere ihtiyaç yoksa, bu migrasyonu çalıştırmayın ve
-- bunun yerine lib/api/risk-analyses.ts dosyasını güncelleyin.
-- =============================================

-- =============================================================================
-- ACCOUNTS TABLOSU - Banka Hesapları
-- =============================================================================

-- Banka hesabı takibi için accounts tablosu oluştur
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES public.banks(id),
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50),
  account_type VARCHAR(50) CHECK (account_type IN ('checking', 'savings', 'investment', 'other')),
  current_balance NUMERIC DEFAULT 0 CHECK (current_balance >= 0),
  currency VARCHAR(3) DEFAULT 'TRY',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tablo açıklaması
COMMENT ON TABLE public.accounts IS 'Risk analizinde varlık takibi için banka hesapları. Kullanıcıların banka bakiyeleri ve varlık durumu takip edilir.';

-- Sütun açıklamaları
COMMENT ON COLUMN public.accounts.account_type IS 'Hesap tipi: checking (vadesiz), savings (vadeli), investment (yatırım), other (diğer)';
COMMENT ON COLUMN public.accounts.current_balance IS 'Güncel hesap bakiyesi (TL cinsinden)';
COMMENT ON COLUMN public.accounts.last_updated_at IS 'Bakiyenin en son güncellendiği tarih';

-- İndeksler oluştur
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_bank_id ON public.accounts(bank_id);
CREATE INDEX idx_accounts_is_active ON public.accounts(is_active) WHERE is_active = TRUE;

-- İndeks açıklamaları
COMMENT ON INDEX idx_accounts_user_id IS 'Kullanıcıya göre hızlı hesap sorguları için';
COMMENT ON INDEX idx_accounts_bank_id IS 'Bankaya göre filtreleme için';
COMMENT ON INDEX idx_accounts_is_active IS 'Aktif hesapları hızlı bulmak için partial index';

-- RLS etkinleştir
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları
CREATE POLICY "Kullanıcılar kendi hesaplarını görüntüleyebilir"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hesaplarını ekleyebilir"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hesaplarını güncelleyebilir"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hesaplarını silebilir"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Admin politikası (isteğe bağlı)
CREATE POLICY "Adminler tüm hesapları görebilir"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================================================
-- CREDIT_CARDS TABLOSU - Kredi Kartları
-- =============================================================================

-- Kredi kartı takibi için credit_cards tablosu oluştur
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES public.banks(id),
  card_name VARCHAR(255) NOT NULL,
  card_number_last4 VARCHAR(4),
  credit_limit NUMERIC NOT NULL CHECK (credit_limit >= 0),
  current_debt NUMERIC DEFAULT 0 CHECK (current_debt >= 0),
  minimum_payment_rate NUMERIC DEFAULT 0.03 CHECK (minimum_payment_rate > 0 AND minimum_payment_rate <= 1),
  interest_rate NUMERIC CHECK (interest_rate >= 0),
  statement_day INTEGER CHECK (statement_day BETWEEN 1 AND 31),
  payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tablo açıklaması
COMMENT ON TABLE public.credit_cards IS 'Risk analizinde borç takibi için kredi kartları. Kredi kartı limitleri, mevcut borç ve kullanım oranları takip edilir.';

-- Sütun açıklamaları
COMMENT ON COLUMN public.credit_cards.card_number_last4 IS 'Güvenlik için sadece son 4 hane saklanır';
COMMENT ON COLUMN public.credit_cards.credit_limit IS 'Kredi kartı limiti (TL)';
COMMENT ON COLUMN public.credit_cards.current_debt IS 'Mevcut borç tutarı (TL)';
COMMENT ON COLUMN public.credit_cards.minimum_payment_rate IS 'Minimum ödeme oranı (varsayılan %3)';
COMMENT ON COLUMN public.credit_cards.interest_rate IS 'Aylık faiz oranı (%)';
COMMENT ON COLUMN public.credit_cards.statement_day IS 'Ekstre kesim günü (ayın kaçı)';
COMMENT ON COLUMN public.credit_cards.payment_due_day IS 'Son ödeme günü (ayın kaçı)';

-- İndeksler oluştur
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_credit_cards_bank_id ON public.credit_cards(bank_id);
CREATE INDEX idx_credit_cards_is_active ON public.credit_cards(is_active) WHERE is_active = TRUE;

-- İndeks açıklamaları
COMMENT ON INDEX idx_credit_cards_user_id IS 'Kullanıcıya göre hızlı kredi kartı sorguları için';
COMMENT ON INDEX idx_credit_cards_bank_id IS 'Bankaya göre filtreleme için';
COMMENT ON INDEX idx_credit_cards_is_active IS 'Aktif kartları hızlı bulmak için partial index';

-- RLS etkinleştir
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları
CREATE POLICY "Kullanıcılar kendi kredi kartlarını görüntüleyebilir"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kredi kartlarını ekleyebilir"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kredi kartlarını güncelleyebilir"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kredi kartlarını silebilir"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Admin politikası (isteğe bağlı)
CREATE POLICY "Adminler tüm kredi kartlarını görebilir"
  ON public.credit_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================================================
-- DOĞRULAMA
-- =============================================================================

-- Tabloların başarıyla oluşturulduğunu doğrula
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
    RAISE NOTICE '✅ accounts tablosu başarıyla oluşturuldu';
  ELSE
    RAISE EXCEPTION '❌ accounts tablosu oluşturulamadı';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_cards') THEN
    RAISE NOTICE '✅ credit_cards tablosu başarıyla oluşturuldu';
  ELSE
    RAISE EXCEPTION '❌ credit_cards tablosu oluşturulamadı';
  END IF;

  RAISE NOTICE '✅ Migrasyon başarıyla tamamlandı!';
  RAISE NOTICE 'ℹ️  Şimdi risk analizi özelliği accounts ve credit_cards tablolarını kullanabilir.';
END $$;

-- =============================================================================
-- GERİ ALMA SCRİPTİ
-- =============================================================================
-- Bu migrasyonu geri almak için aşağıdaki komutları çalıştırın:
--
-- DROP POLICY IF EXISTS "Adminler tüm kredi kartlarını görebilir" ON public.credit_cards;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını silebilir" ON public.credit_cards;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını güncelleyebilir" ON public.credit_cards;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını ekleyebilir" ON public.credit_cards;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi kredi kartlarını görüntüleyebilir" ON public.credit_cards;
--
-- DROP POLICY IF EXISTS "Adminler tüm hesapları görebilir" ON public.accounts;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını silebilir" ON public.accounts;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını güncelleyebilir" ON public.accounts;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını ekleyebilir" ON public.accounts;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi hesaplarını görüntüleyebilir" ON public.accounts;
--
-- DROP TABLE IF EXISTS public.credit_cards CASCADE;
-- DROP TABLE IF EXISTS public.accounts CASCADE;
