-- =============================================================================
-- DATABASE LOGIC & TRIGGERS
-- Bu dosya projedeki tüm saklı yordamları (functions) ve tetikleyicileri (triggers) içerir.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BÖLÜM 1: FONKSİYONLAR (FUNCTIONS)
-- -----------------------------------------------------------------------------

-- 1. Genel Güncelleme Fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Admin Kontrolü
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Auth kontrolü ve profiles tablosu kontrolü
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true);
END;
$$;

-- 3. Kredi Durumu Hesaplama
CREATE OR REPLACE FUNCTION calculate_credit_status(p_credit_id uuid)
RETURNS TABLE(remaining_debt numeric, remaining_installments integer, payment_progress numeric, status text, overdue_days integer)
LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    RETURN QUERY SELECT c.remaining_debt, c.remaining_installments, c.payment_progress, c.status, c.overdue_days 
    FROM public.credits c WHERE c.id = p_credit_id;
END;
$$;

-- 4. Finansal Sağlık Metrikleri
CREATE OR REPLACE FUNCTION calculate_financial_health_metrics(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN json_build_object('health_score', 0, 'status', 'calculating');
END;
$$;

-- 5. Özellik Kullanım İzni Kontrolü
CREATE OR REPLACE FUNCTION can_use_feature(p_user_id uuid, p_feature_type text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM usage_tracking WHERE user_id = p_user_id AND feature_type = p_feature_type AND used_count < limit_count);
END;
$$;

-- 6. Kredi Kaydetme İzni
CREATE OR REPLACE FUNCTION can_user_save_credit(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN TRUE; -- Mantık buraya eklenebilir
END;
$$;

-- 7. Abonelik Durumu Kontrolü
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id uuid)
RETURNS TABLE(is_active boolean, plan_type text, expires_at timestamp with time zone, days_remaining integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT (status = 'active'), plan_type, expires_at, (EXTRACT(DAY FROM expires_at - NOW())::integer)
    FROM subscriptions WHERE user_id = p_user_id;
END;
$$;

-- 8. Temizlik Fonksiyonları
CREATE OR REPLACE FUNCTION cleanup_expired_pending_payments() RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN END; $$;
CREATE OR REPLACE FUNCTION cleanup_expired_pending_subscriptions() RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN '{}'::json; END; $$;
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN '{}'::json; END; $$;
CREATE OR REPLACE FUNCTION cleanup_old_pending_subscriptions() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN END; $$;
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN END; $$;

-- 9. Trigger Fonksiyonu: Varsayılan Bildirim Tercihleri
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- 10. Fatura Oluşturma
CREATE OR REPLACE FUNCTION create_invoice_for_payment(p_user_id uuid, p_subscription_id uuid, p_payment_id text, p_amount numeric, p_plan_type text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_id uuid;
BEGIN
    INSERT INTO invoices (user_id, subscription_id, amount, status, invoice_number, invoice_date) 
    VALUES (p_user_id, p_subscription_id, p_amount, 'paid', 'INV-' || floor(random()*10000)::text, CURRENT_DATE) RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

-- 11. Ödeme Hatırlatıcıları
CREATE OR REPLACE FUNCTION create_payment_reminders_batch() RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN '{}'::json; END; $$;

-- 12. Banka Borç Kırılımı
CREATE OR REPLACE FUNCTION get_bank_debt_breakdown(p_user_id uuid)
RETURNS TABLE(bank_id uuid, bank_name text, bank_logo text, total_debt numeric, monthly_payment numeric, credit_count integer, avg_interest_rate numeric)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT id, name, logo_url, 0::numeric, 0::numeric, 0, 0::numeric FROM banks LIMIT 0;
END;
$$;

-- 13. Kredi Detayları
CREATE OR REPLACE FUNCTION get_credit_details(p_credit_id uuid, p_user_id uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN '{}'::json; END; $$;

-- 14. Kart Tipi Eşleştirme
CREATE OR REPLACE FUNCTION get_matched_card_type(p_bank_name text, p_selected_type text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN 'unknown'; END; $$;

-- 15. OCR Kayıt Sayısı
CREATE OR REPLACE FUNCTION get_ocr_save_count(p_user_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN 0; END; $$;

-- 16. Yaklaşan Ödemeler
CREATE OR REPLACE FUNCTION get_upcoming_payments(p_user_id uuid, p_days_ahead integer DEFAULT 30)
RETURNS TABLE(payment_date date, total_amount numeric, payment_count integer, payments json)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT CURRENT_DATE, 0::numeric, 0, '{}'::json;
END;
$$;

-- 17. Dashboard Özeti
CREATE OR REPLACE FUNCTION get_user_dashboard_summary(p_user_id uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN '{}'::json; END; $$;

-- 18. Trigger Fonksiyonları (İş Mantığı)
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION handle_subscription_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- 19. Sayaç Artırma Fonksiyonları
CREATE OR REPLACE FUNCTION increment_saved_credits(p_user_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN TRUE; END; $$;
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid, p_feature_type text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN TRUE; END; $$;

-- 20. Başlatma (Initialize) Trigger Fonksiyonları
CREATE OR REPLACE FUNCTION initialize_free_tier() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION initialize_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN
    INSERT INTO financial_profiles (user_id) VALUES (NEW.id);
    INSERT INTO risk_analyses (user_id, analysis_data) VALUES (NEW.id, '{}'::jsonb);
    RETURN NEW; 
END; 
$$;

-- 21. Diğer Trigger Fonksiyonları (Stubs & Specific Updates)
CREATE OR REPLACE FUNCTION update_account_balance_after_transaction() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_banking_credentials_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_billing_info_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_blog_category_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_blog_post_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_credit_after_payment_change() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_credit_card_debt_after_transaction() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_credit_card_types_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_credit_cards_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_invoice_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION update_usage_limits_for_subscription(p_user_id uuid, p_plan_type text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN END; $$;


-- -----------------------------------------------------------------------------
-- BÖLÜM 2: TETİKLEYİCİLER (TRIGGERS)
-- -----------------------------------------------------------------------------

-- Profiles
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON profiles;
CREATE TRIGGER create_default_notification_preferences_trigger AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

DROP TRIGGER IF EXISTS on_profile_created_initialize_user ON profiles;
CREATE TRIGGER on_profile_created_initialize_user AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION initialize_new_user();

DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON profiles;
CREATE TRIGGER on_user_created_initialize_free_tier AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION initialize_free_tier();

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Risk Analyses
DROP TRIGGER IF EXISTS handle_risk_analyses_updated_at ON risk_analyses;
CREATE TRIGGER handle_risk_analyses_updated_at BEFORE UPDATE ON risk_analyses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON risk_analyses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON risk_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Financial Profiles
DROP TRIGGER IF EXISTS on_financial_profiles_updated ON financial_profiles;
CREATE TRIGGER on_financial_profiles_updated BEFORE UPDATE ON financial_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON financial_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON financial_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions
DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change AFTER INSERT OR UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION handle_subscription_change();

DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payment Plans
DROP TRIGGER IF EXISTS update_credit_status_on_payment_change ON payment_plans;
CREATE TRIGGER update_credit_status_on_payment_change AFTER INSERT OR DELETE OR UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_credit_after_payment_change();

DROP TRIGGER IF EXISTS set_updated_at ON payment_plans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Banking Credentials
DROP TRIGGER IF EXISTS update_banking_credentials_updated_at ON banking_credentials;
CREATE TRIGGER update_banking_credentials_updated_at BEFORE UPDATE ON banking_credentials FOR EACH ROW EXECUTE FUNCTION update_banking_credentials_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON banking_credentials;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON banking_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Billing Info
DROP TRIGGER IF EXISTS update_billing_info_updated_at_trigger ON billing_info;
CREATE TRIGGER update_billing_info_updated_at_trigger BEFORE UPDATE ON billing_info FOR EACH ROW EXECUTE FUNCTION update_billing_info_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON billing_info;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON billing_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Blog Categories
DROP TRIGGER IF EXISTS trigger_update_blog_category_updated_at ON blog_categories;
CREATE TRIGGER trigger_update_blog_category_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_blog_category_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON blog_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Blog Posts
DROP TRIGGER IF EXISTS trigger_update_blog_post_updated_at ON blog_posts;
CREATE TRIGGER trigger_update_blog_post_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_blog_post_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON blog_posts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Invoices
DROP TRIGGER IF EXISTS trigger_update_invoice_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoice_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_invoice_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON invoices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notification Preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON notification_preferences;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscription Plans
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_subscription_plans_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON subscription_plans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PayTR & Webhooks (Duplicate names in list handled by calling same logic)
DROP TRIGGER IF EXISTS update_paytr_saved_cards_updated_at ON paytr_saved_cards;
CREATE TRIGGER update_paytr_saved_cards_updated_at BEFORE UPDATE ON paytr_saved_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON paytr_saved_cards;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON paytr_saved_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_paytr_user_tokens_updated_at ON paytr_user_tokens;
CREATE TRIGGER update_paytr_user_tokens_updated_at BEFORE UPDATE ON paytr_user_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON paytr_user_tokens;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON paytr_user_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pending_subscriptions_updated_at ON pending_subscriptions;
CREATE TRIGGER update_pending_subscriptions_updated_at BEFORE UPDATE ON pending_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON pending_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pending_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_logs_updated_at ON webhook_logs;
CREATE TRIGGER update_webhook_logs_updated_at BEFORE UPDATE ON webhook_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON webhook_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON webhook_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Diğer Tekil 'set_updated_at' Triggerları
DROP TRIGGER IF EXISTS set_updated_at ON credits;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON banks;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON credit_types;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credit_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON usage_tracking;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON newsletter_subscribers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();