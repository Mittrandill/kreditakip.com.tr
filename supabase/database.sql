-- ============================================================================
-- Kredi Takip - Database Schema
-- Version: 1.0.0
-- Last Updated: 2025-12-05
--
-- Bu dosya yalnızca referans amaçlıdır, doğrudan çalıştırılmak üzere değildir.
-- Veritabanı değişiklikleri için migrations/ klasöründeki dosyaları kullanın.
-- ============================================================================

-- ============================================================================
-- PROFILES - Kullanıcı profil bilgileri
-- ============================================================================
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  avatar_url text,
  theme text DEFAULT 'light'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  is_admin boolean DEFAULT false,
  email_monthly_summary boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON COLUMN public.profiles.email_monthly_summary IS 'Aylık ödeme özeti e-postası alınsın mı';
COMMENT ON COLUMN public.profiles.email_weekly_summary IS 'Haftalık ödeme özeti e-postası alınsın mı';

-- ============================================================================
-- BANKS - Banka bilgileri
-- ============================================================================
CREATE TABLE public.banks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  contact_phone text,
  contact_email text,
  website text,
  category character varying DEFAULT 'Diğer'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- CREDIT_TYPES - Kredi türleri
-- ============================================================================
CREATE TABLE public.credit_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category character varying,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  interest_rate_range character varying,
  typical_amount_range character varying,
  typical_term_range character varying,
  requirements text[],
  features text[],
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- CREDITS - Kredi kayıtları
-- ============================================================================
CREATE TABLE public.credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_id uuid NOT NULL REFERENCES public.banks(id),
  credit_type_id uuid NOT NULL REFERENCES public.credit_types(id),
  credit_code text NOT NULL,
  account_number text,
  initial_amount numeric NOT NULL,
  remaining_debt numeric NOT NULL,
  monthly_payment numeric NOT NULL,
  interest_rate numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  last_payment_date date,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'closed'::text, 'overdue'::text])),
  payment_progress numeric DEFAULT 0 CHECK (payment_progress >= 0 AND payment_progress <= 100),
  remaining_installments integer DEFAULT 0,
  total_installments integer DEFAULT 0,
  overdue_days integer DEFAULT 0 CHECK (overdue_days >= 0),
  collateral text,
  insurance_status text DEFAULT 'active'::text,
  branch_name text,
  customer_number text,
  credit_score text,
  calculated_interest_rate numeric,
  total_payback numeric DEFAULT 0,
  currency text DEFAULT 'TRY'::text CHECK (currency = ANY (ARRAY['TRY'::text, 'USD'::text, 'EUR'::text, 'GBP'::text, 'GOLD'::text])),
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PAYMENT_PLANS - Ödeme planları
-- ============================================================================
CREATE TABLE public.payment_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id uuid NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  installment_number integer NOT NULL CHECK (installment_number > 0),
  due_date date NOT NULL,
  principal_amount numeric NOT NULL,
  interest_amount numeric NOT NULL,
  total_payment numeric NOT NULL,
  remaining_debt numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['paid'::text, 'pending'::text, 'overdue'::text])),
  payment_date date,
  payment_channel text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PAYMENT_HISTORY - Ödeme geçmişi
-- ============================================================================
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id uuid NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  payment_plan_id uuid REFERENCES public.payment_plans(id),
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_channel text,
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['completed'::text, 'failed'::text, 'pending'::text])),
  transaction_id text,
  notes text,
  reference_number character varying,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- NOTIFICATIONS - Bildirimler
-- ============================================================================
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credit_id uuid REFERENCES public.credits(id) ON DELETE SET NULL,
  payment_plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])),
  notification_type text DEFAULT 'app'::text CHECK (notification_type = ANY (ARRAY['email'::text, 'app'::text, 'app_reminder'::text, 'app_overdue'::text, 'app_reminder_3_days'::text, 'app_reminder_1_day'::text, 'app_reminder_today'::text])),
  is_read boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  email_delivery_status text CHECK (email_delivery_status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'bounced'::text])),
  email_provider_id text,
  email_error_message text,
  retry_count integer DEFAULT 0,
  scheduled_for timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON COLUMN public.notifications.notification_type IS 'Bildirim tipi: app (uygulama içi), email (email bildirimi)';

-- ============================================================================
-- NOTIFICATION_PREFERENCES - Bildirim tercihleri
-- ============================================================================
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  email_3_days_before boolean DEFAULT true,
  email_1_day_before boolean DEFAULT true,
  email_on_due_date boolean DEFAULT true,
  email_overdue boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  sms_1_day_before boolean DEFAULT false,
  sms_on_due_date boolean DEFAULT false,
  notification_time time without time zone DEFAULT '09:00:00'::time,
  subscription_renewal_reminder boolean DEFAULT true,
  subscription_payment_failed boolean DEFAULT true,
  subscription_canceled boolean DEFAULT true,
  subscription_expired boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- SUBSCRIPTION_PLANS - Abonelik planları
-- ============================================================================
CREATE TABLE public.subscription_plans (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  original_price numeric,
  currency text DEFAULT 'TRY'::text,
  billing_period text NOT NULL CHECK (billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text, 'lifetime'::text])),
  billing_interval integer DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  paddle_product_id character varying,
  paddle_price_id character varying,
  payment_provider character varying DEFAULT 'paddle'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PADDLE_CUSTOMERS - Paddle müşteri eşleştirmesi
-- ============================================================================
CREATE TABLE public.paddle_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_customer_id character varying NOT NULL UNIQUE,
  email character varying,
  name character varying,
  country character varying(2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- SUBSCRIPTIONS - Abonelik bilgileri (Paddle entegrasyonlu)
-- ============================================================================
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY['free'::text, 'premium'::text])),
  plan_id text REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'canceled'::text, 'expired'::text, 'suspended'::text, 'past_due'::text, 'paused'::text, 'trialing'::text])),
  start_date timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  end_date timestamp with time zone,
  payment_method text,
  payment_id text,
  -- Paddle integration fields
  paddle_subscription_id character varying,
  paddle_plan_id character varying,
  paddle_customer_id character varying REFERENCES public.paddle_customers(paddle_customer_id),
  paddle_checkout_id character varying,
  paddle_subscription_data jsonb,
  cancel_url text,
  update_url text,
  -- Status tracking
  status_updated_at timestamp with time zone,
  canceled_at timestamp with time zone,
  paused_at timestamp with time zone,
  suspended_at timestamp with time zone,
  -- Grace period fields
  grace_period_started_at timestamp with time zone,
  grace_period_ends_at timestamp with time zone,
  requires_payment_action boolean DEFAULT false,
  -- Billing
  next_billing_plan text,
  reminder_sent_at timestamp with time zone,
  -- Soft delete
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT subscriptions_plan_id_check CHECK ((plan_id = ANY (ARRAY['free'::text, 'pro-monthly'::text, 'pro-yearly'::text, 'premium-monthly'::text, 'premium-yearly'::text])) OR plan_id IS NULL)
);

COMMENT ON TABLE public.subscriptions IS 'User subscriptions with full Paddle integration';
COMMENT ON COLUMN public.subscriptions.start_date IS 'Subscription başlangıç tarihi';
COMMENT ON COLUMN public.subscriptions.paddle_subscription_id IS 'Paddle subscription identifier';
COMMENT ON COLUMN public.subscriptions.paddle_customer_id IS 'Paddle customer identifier';
COMMENT ON COLUMN public.subscriptions.grace_period_started_at IS 'Start of grace period after failed payment';
COMMENT ON COLUMN public.subscriptions.grace_period_ends_at IS 'End of grace period (7 days after start)';
COMMENT ON COLUMN public.subscriptions.requires_payment_action IS 'Flag for pending payment actions';

-- ============================================================================
-- PADDLE_WEBHOOK_EVENTS - Paddle webhook logları
-- ============================================================================
CREATE TABLE public.paddle_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id character varying NOT NULL UNIQUE,
  event_type character varying NOT NULL,
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.paddle_webhook_events IS 'Stores all Paddle webhook events for processing';

-- ============================================================================
-- SUBSCRIPTION_USAGE - Özellik kullanım takibi
-- ============================================================================
CREATE TABLE public.subscription_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  feature_type text NOT NULL CHECK (feature_type = ANY (ARRAY['ocr_analysis'::text, 'risk_analysis'::text])),
  usage_count integer DEFAULT 0,
  limit_count integer NOT NULL,
  saved_credits_count integer DEFAULT 0,
  saved_credits_limit integer DEFAULT 1,
  reset_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.subscription_usage IS 'Tracks feature usage per subscription';
COMMENT ON COLUMN public.subscription_usage.saved_credits_limit IS 'Maximum number of credits that can be saved from OCR analysis';

-- ============================================================================
-- PENDING_SUBSCRIPTIONS - Bekleyen abonelik işlemleri
-- ============================================================================
CREATE TABLE public.pending_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  token text UNIQUE,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'expired'::text])),
  subscription_reference text,
  expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.pending_subscriptions IS 'Paddle checkout tracking';

-- ============================================================================
-- PAYMENT_TRANSACTIONS - Ödeme işlemleri
-- ============================================================================
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'TRY'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  payment_method text,
  plan_id text,
  paddle_transaction_id character varying,
  paddle_order_id character varying,
  payment_provider character varying DEFAULT 'paddle'::character varying,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON COLUMN public.payment_transactions.payment_provider IS 'Payment provider used for this transaction. Always paddle after PayTR migration.';

-- ============================================================================
-- INVOICES - Faturalar
-- ============================================================================
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  due_date date,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TRY'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
  description text,
  file_url text,
  file_name text,
  payment_date timestamp with time zone,
  payment_id text,
  paddle_transaction_id character varying,
  paddle_invoice_id character varying,
  payment_provider character varying DEFAULT 'paddle'::character varying,
  subscription_reference character varying,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON COLUMN public.invoices.payment_provider IS 'Payment provider used for this invoice. Always paddle after PayTR migration.';

-- ============================================================================
-- BILLING_INFO - Fatura bilgileri
-- ============================================================================
CREATE TABLE public.billing_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  district text,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'Türkiye'::text,
  tax_number text,
  tax_office text,
  identity_number character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.billing_info IS 'Stores user billing information for premium subscriptions and payments';
COMMENT ON COLUMN public.billing_info.identity_number IS 'Turkish identity number (TC Kimlik No) collected during payment';

-- ============================================================================
-- FINANCIAL_PROFILES - Finansal profil bilgileri
-- ============================================================================
CREATE TABLE public.financial_profiles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income numeric DEFAULT 0 CHECK (monthly_income >= 0),
  monthly_expenses numeric DEFAULT 0 CHECK (monthly_expenses >= 0),
  annual_income numeric CHECK (annual_income >= 0),
  total_assets numeric DEFAULT 0 CHECK (total_assets >= 0),
  total_liabilities numeric DEFAULT 0 CHECK (total_liabilities >= 0),
  employment_status text,
  employment_duration_months integer CHECK (employment_duration_months >= 0),
  housing_status text,
  dependents_count integer DEFAULT 0 CHECK (dependents_count >= 0),
  education_level text,
  industry_sector text,
  -- Assets breakdown
  emergency_fund numeric DEFAULT 0 CHECK (emergency_fund >= 0),
  investment_portfolio numeric DEFAULT 0 CHECK (investment_portfolio >= 0),
  bank_deposits numeric DEFAULT 0 CHECK (bank_deposits >= 0),
  real_estate_value numeric DEFAULT 0 CHECK (real_estate_value >= 0),
  vehicle_value numeric DEFAULT 0 CHECK (vehicle_value >= 0),
  other_assets numeric DEFAULT 0 CHECK (other_assets >= 0),
  other_investments numeric DEFAULT 0 CHECK (other_investments >= 0),
  -- Liabilities & obligations
  credit_card_debt numeric DEFAULT 0 CHECK (credit_card_debt >= 0),
  monthly_rent_mortgage numeric DEFAULT 0 CHECK (monthly_rent_mortgage >= 0),
  other_monthly_obligations numeric DEFAULT 0 CHECK (other_monthly_obligations >= 0),
  other_debt_obligations text,
  -- Insurance & goals
  has_health_insurance boolean DEFAULT false,
  has_life_insurance boolean DEFAULT false,
  savings_goals text,
  financial_goals text,
  risk_tolerance text,
  investment_experience text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- RISK_ANALYSES - Risk analizi sonuçları
-- ============================================================================
CREATE TABLE public.risk_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data jsonb NOT NULL,
  overall_risk_score text,
  overall_risk_color text,
  debt_to_income_ratio text,
  monthly_income numeric,
  monthly_expenses numeric,
  total_assets numeric,
  total_credits_count integer DEFAULT 0,
  total_debt_amount numeric DEFAULT 0,
  total_accounts_count integer DEFAULT 0,
  total_credit_cards_count integer DEFAULT 0,
  total_account_balance numeric DEFAULT 0,
  credit_card_utilization_rate text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- BANKING_CREDENTIALS - Banka erişim bilgileri (şifreli)
-- ============================================================================
CREATE TABLE public.banking_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id uuid NOT NULL REFERENCES public.banks(id),
  credential_name character varying NOT NULL,
  username character varying,
  encrypted_password text,
  credential_type character varying DEFAULT 'internet_banking'::character varying CHECK (credential_type = ANY (ARRAY['internet_banking', 'mobile_banking', 'phone_banking', 'other'])),
  notes text,
  last_used_date timestamp with time zone,
  is_active boolean DEFAULT true,
  password_change_frequency_days integer,
  last_password_change_date timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- BLOG_CATEGORIES - Blog kategorileri
-- ============================================================================
CREATE TABLE public.blog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- BLOG_POSTS - Blog yazıları
-- ============================================================================
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  read_time integer,
  views integer DEFAULT 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- NEWSLETTER_SUBSCRIBERS - Newsletter aboneleri
-- ============================================================================
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- USAGE_TRACKING - Eski kullanım takibi (DEPRECATED - subscription_usage kullanın)
-- ============================================================================
CREATE TABLE public.usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_type text NOT NULL CHECK (feature_type = ANY (ARRAY['ocr_analysis'::text, 'risk_analysis'::text])),
  used_count integer DEFAULT 0,
  limit_count integer NOT NULL,
  saved_credits_count integer NOT NULL DEFAULT 0,
  reset_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.usage_tracking IS 'DEPRECATED: Use subscription_usage instead. This table will be removed in future versions.';

-- ============================================================================
-- subscription_status_view - Abonelik durumu view'ı
-- ============================================================================
CREATE OR REPLACE VIEW public.subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.plan_type,
    s.status,
    -- Computed effective status with grace period logic
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled', 'canceled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.paused_at,
    s.suspended_at,
    s.grace_period_started_at,
    s.grace_period_ends_at,
    s.requires_payment_action,
    s.paddle_subscription_id,
    s.paddle_customer_id,
    s.paddle_plan_id,
    s.paddle_checkout_id,
    s.cancel_url,
    s.update_url,
    -- Plan details
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,
    -- Timestamps
    s.created_at,
    s.updated_at,
    s.deleted_at,
    -- Usage data
    jsonb_build_object(
        'ocrAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', su.limit_count,
                'used', su.usage_count,
                'savedCredits', su.saved_credits_count,
                'savedCreditsLimit', su.saved_credits_limit,
                'resetAt', su.reset_at,
                'canUse', (su.usage_count < su.limit_count)
            )
            FROM subscription_usage su
            WHERE su.user_id = s.user_id AND su.feature_type = 'ocr_analysis'
            ORDER BY su.created_at DESC LIMIT 1
        ), '{"limit": 0, "used": 0, "savedCredits": 0, "savedCreditsLimit": 1, "resetAt": null, "canUse": false}'::jsonb),
        'riskAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', su.limit_count,
                'used', su.usage_count,
                'savedCredits', su.saved_credits_count,
                'savedCreditsLimit', su.saved_credits_limit,
                'resetAt', su.reset_at,
                'canUse', (su.usage_count < su.limit_count)
            )
            FROM subscription_usage su
            WHERE su.user_id = s.user_id AND su.feature_type = 'risk_analysis'
            ORDER BY su.created_at DESC LIMIT 1
        ), '{"limit": 0, "used": 0, "savedCredits": 0, "savedCreditsLimit": 1, "resetAt": null, "canUse": false}'::jsonb)
    ) as usage
FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;

COMMENT ON VIEW public.subscription_status_view IS
'Subscription status with computed grace period logic and plan details.
This view computes effective_status based on grace period, joins subscription plan details,
aggregates usage tracking data, and filters out soft-deleted subscriptions.';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Credits indexes
CREATE INDEX idx_credits_user_id ON public.credits(user_id);
CREATE INDEX idx_credits_bank_id ON public.credits(bank_id);
CREATE INDEX idx_credits_status ON public.credits(status);
CREATE INDEX idx_credits_deleted_at ON public.credits(deleted_at) WHERE deleted_at IS NULL;

-- Payment plans indexes
CREATE INDEX idx_payment_plans_credit_id ON public.payment_plans(credit_id);
CREATE INDEX idx_payment_plans_due_date ON public.payment_plans(due_date);
CREATE INDEX idx_payment_plans_status ON public.payment_plans(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_paddle_sub_id ON public.subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_paddle_customer_id ON public.subscriptions(paddle_customer_id);
CREATE INDEX idx_subscriptions_deleted_at ON public.subscriptions(deleted_at) WHERE deleted_at IS NULL;

-- Paddle indexes
CREATE INDEX idx_paddle_customers_user_id ON public.paddle_customers(user_id);
CREATE INDEX idx_paddle_webhook_events_event_type ON public.paddle_webhook_events(event_type);
CREATE INDEX idx_paddle_webhook_events_processed ON public.paddle_webhook_events(processed);

-- Subscription usage indexes
CREATE INDEX idx_subscription_usage_user_id ON public.subscription_usage(user_id);
CREATE INDEX idx_subscription_usage_feature_type ON public.subscription_usage(feature_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paddle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
