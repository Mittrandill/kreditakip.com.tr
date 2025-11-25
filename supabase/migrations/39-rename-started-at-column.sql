-- =====================================================
-- Migration: 39-rename-started-at-column
-- Date: 2025-01-18
-- Description: started_at -> start_date (kod uyumluluğu için)
-- =====================================================

BEGIN;

-- Sadece column rename yap (mevcut veriler etkilenmez)
ALTER TABLE public.subscriptions
RENAME COLUMN started_at TO start_date;

-- Comment güncelle
COMMENT ON COLUMN public.subscriptions.start_date
IS 'Subscription başlangıç tarihi';

-- iyzico_subscription_id alanına comment ekle (kullanım amacını netleştir)
COMMENT ON COLUMN public.subscriptions.iyzico_subscription_id
IS 'iyzico payment ID (normal payment API) veya subscription ID (subscription API)';

COMMIT;
