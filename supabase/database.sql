-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.banking_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_id uuid NOT NULL,
  credential_name character varying NOT NULL,
  username character varying,
  encrypted_password text,
  credential_type character varying DEFAULT 'internet_banking'::character varying CHECK (credential_type::text = ANY (ARRAY['internet_banking'::character varying::text, 'mobile_banking'::character varying::text, 'phone_banking'::character varying::text, 'other'::character varying::text])),
  notes text,
  last_used_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_change_frequency_days integer,
  last_password_change_date timestamp with time zone,
  deleted_at timestamp with time zone,
  CONSTRAINT banking_credentials_pkey PRIMARY KEY (id),
  CONSTRAINT banking_credentials_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id),
  CONSTRAINT banking_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.banks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  contact_phone text,
  contact_email text,
  website text,
  created_at timestamp with time zone DEFAULT now(),
  category character varying DEFAULT 'Diğer'::character varying,
  is_active boolean DEFAULT true,
  CONSTRAINT banks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.billing_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'Türkiye'::text,
  tax_number text,
  tax_office text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  district text,
  identity_number character varying,
  CONSTRAINT billing_info_pkey PRIMARY KEY (id),
  CONSTRAINT billing_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.blog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  category_id uuid,
  author_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  read_time integer,
  views integer DEFAULT 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id)
);
CREATE TABLE public.credit_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  category character varying,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  interest_rate_range character varying,
  typical_amount_range character varying,
  typical_term_range character varying,
  requirements ARRAY,
  features ARRAY,
  CONSTRAINT credit_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_id uuid NOT NULL,
  credit_type_id uuid NOT NULL,
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
  payment_progress numeric DEFAULT 0 CHECK (payment_progress >= 0::numeric AND payment_progress <= 100::numeric),
  remaining_installments integer DEFAULT 0,
  total_installments integer DEFAULT 0,
  overdue_days integer DEFAULT 0 CHECK (overdue_days >= 0),
  collateral text,
  insurance_status text DEFAULT 'active'::text,
  branch_name text,
  customer_number text,
  credit_score text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  calculated_interest_rate numeric DEFAULT NULL::numeric,
  total_payback numeric DEFAULT 0,
  currency text DEFAULT 'TRY'::text CHECK (currency = ANY (ARRAY['TRY'::text, 'USD'::text, 'EUR'::text, 'GBP'::text, 'GOLD'::text])),
  deleted_at timestamp with time zone,
  CONSTRAINT credits_pkey PRIMARY KEY (id),
  CONSTRAINT credits_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id),
  CONSTRAINT credits_credit_type_id_fkey FOREIGN KEY (credit_type_id) REFERENCES public.credit_types(id),
  CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.financial_profiles (
  user_id uuid NOT NULL,
  monthly_income numeric DEFAULT 0 CHECK (monthly_income >= 0::numeric),
  monthly_expenses numeric DEFAULT 0 CHECK (monthly_expenses >= 0::numeric),
  total_assets numeric DEFAULT 0 CHECK (total_assets >= 0::numeric),
  total_liabilities numeric DEFAULT 0 CHECK (total_liabilities >= 0::numeric),
  employment_status text,
  housing_status text,
  other_debt_obligations text,
  savings_goals text,
  risk_tolerance text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  employment_duration_months integer CHECK (employment_duration_months >= 0),
  annual_income numeric CHECK (annual_income >= 0::numeric),
  emergency_fund numeric DEFAULT 0 CHECK (emergency_fund >= 0::numeric),
  investment_portfolio numeric DEFAULT 0 CHECK (investment_portfolio >= 0::numeric),
  real_estate_value numeric DEFAULT 0 CHECK (real_estate_value >= 0::numeric),
  vehicle_value numeric DEFAULT 0 CHECK (vehicle_value >= 0::numeric),
  other_assets numeric DEFAULT 0 CHECK (other_assets >= 0::numeric),
  credit_card_debt numeric DEFAULT 0 CHECK (credit_card_debt >= 0::numeric),
  other_monthly_obligations numeric DEFAULT 0 CHECK (other_monthly_obligations >= 0::numeric),
  dependents_count integer DEFAULT 0 CHECK (dependents_count >= 0),
  education_level text,
  industry_sector text,
  monthly_rent_mortgage numeric DEFAULT 0 CHECK (monthly_rent_mortgage >= 0::numeric),
  has_health_insurance boolean DEFAULT false,
  has_life_insurance boolean DEFAULT false,
  financial_goals text,
  investment_experience text,
  other_investments numeric DEFAULT 0 CHECK (other_investments >= 0::numeric),
  bank_deposits numeric DEFAULT 0 CHECK (bank_deposits >= 0::numeric),
  CONSTRAINT financial_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT financial_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subscription_id uuid,
  payment_id text,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_3_days_before boolean DEFAULT true,
  email_1_day_before boolean DEFAULT true,
  email_on_due_date boolean DEFAULT true,
  email_overdue boolean DEFAULT true,
  sms_1_day_before boolean DEFAULT false,
  sms_on_due_date boolean DEFAULT false,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  notification_time time without time zone DEFAULT '09:00:00'::time without time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credit_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  payment_plan_id uuid,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])),
  notification_type text DEFAULT 'in_app'::text CHECK (notification_type = ANY (ARRAY['email'::text, 'app'::text, 'app_reminder'::text, 'app_overdue'::text, 'app_reminder_3_days'::text, 'app_reminder_1_day'::text, 'app_reminder_today'::text])),
  email_sent_at timestamp with time zone,
  email_delivery_status text CHECK (email_delivery_status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'bounced'::text])),
  email_provider_id text,
  email_error_message text,
  retry_count integer DEFAULT 0,
  scheduled_for timestamp with time zone,
  deleted_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES public.credits(id),
  CONSTRAINT notifications_payment_plan_id_fkey FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id)
);
CREATE TABLE public.paddle_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  paddle_customer_id character varying NOT NULL UNIQUE,
  email character varying,
  name character varying,
  country character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paddle_customers_pkey PRIMARY KEY (id),
  CONSTRAINT paddle_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.paddle_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id character varying NOT NULL UNIQUE,
  event_type character varying NOT NULL,
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paddle_webhook_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL,
  payment_plan_id uuid,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_channel text,
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['completed'::text, 'failed'::text, 'pending'::text])),
  transaction_id text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  reference_number character varying,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT payment_history_payment_plan_id_fkey FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id),
  CONSTRAINT payment_history_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES public.credits(id)
);
CREATE TABLE public.payment_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL,
  installment_number integer NOT NULL CHECK (installment_number > 0),
  due_date date NOT NULL,
  principal_amount numeric NOT NULL,
  interest_amount numeric NOT NULL,
  total_payment numeric NOT NULL,
  remaining_debt numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['paid'::text, 'pending'::text, 'overdue'::text])),
  payment_date date,
  payment_channel text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT payment_plans_pkey PRIMARY KEY (id),
  CONSTRAINT payment_plans_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES public.credits(id)
);
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'TRY'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  paytr_order_id text,
  paytr_conversation_id text,
  payment_method text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  plan_id text,
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
  CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pending_renewal_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  merchant_oid character varying NOT NULL UNIQUE,
  payment_url text NOT NULL,
  utoken character varying NOT NULL,
  ctoken character varying NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'TRY'::character varying,
  plan_id text NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'expired'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  error_message text,
  paytr_response jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT pending_renewal_payments_pkey PRIMARY KEY (id),
  CONSTRAINT pending_renewal_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT pending_renewal_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
  CONSTRAINT pending_renewal_payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);
CREATE TABLE public.pending_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  token text NOT NULL UNIQUE,
  conversation_id text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  subscription_reference text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT pending_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT pending_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  theme text DEFAULT 'light'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  is_admin boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.risk_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_data jsonb NOT NULL,
  overall_risk_score text,
  overall_risk_color text,
  debt_to_income_ratio text,
  monthly_income numeric,
  monthly_expenses numeric,
  total_assets numeric,
  total_credits_count integer DEFAULT 0,
  total_debt_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_accounts_count integer DEFAULT 0,
  total_credit_cards_count integer DEFAULT 0,
  total_account_balance numeric DEFAULT 0,
  credit_card_utilization_rate text,
  CONSTRAINT risk_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT risk_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscription_plans (
  id text NOT NULL,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  paddle_product_id character varying,
  paddle_price_id character varying,
  payment_provider character varying DEFAULT 'paddle'::character varying,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL CHECK (plan_type = ANY (ARRAY['free'::text, 'premium'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'suspended'::text])),
  start_date timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  plan_id text CHECK ((plan_id = ANY (ARRAY['free'::text, 'pro-monthly'::text, 'pro-yearly'::text, 'premium-monthly'::text, 'premium-yearly'::text])) OR plan_id IS NULL),
  payment_id text,
  end_date timestamp with time zone,
  deleted_at timestamp with time zone,
  next_billing_plan text,
  grace_period_started_at timestamp with time zone,
  grace_period_ends_at timestamp with time zone,
  requires_payment_action boolean DEFAULT false,
  suspended_at timestamp with time zone,
  reminder_sent_at timestamp with time zone,
  paddle_subscription_id character varying,
  paddle_plan_id character varying,
  paddle_customer_id character varying,
  paddle_checkout_id character varying,
  status_updated_at timestamp with time zone,
  cancel_url text,
  update_url text,
  paddle_subscription_data jsonb,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- =============================================================================
-- subscription_status_view - Subscription status with computed grace period logic
-- =============================================================================
CREATE VIEW public.subscription_status_view AS
SELECT
    s.id,
    s.user_id,
    s.plan_id,
    s.status,

    -- Computed field: Grace period status
    -- If subscription is expired/past_due/cancelled BUT grace period hasn't ended,
    -- show 'grace_period' as the effective status
    CASE
        WHEN s.status IN ('expired', 'past_due', 'cancelled')
             AND s.grace_period_ends_at IS NOT NULL
             AND s.grace_period_ends_at > now()
        THEN 'grace_period'
        ELSE s.status
    END as effective_status,

    -- Subscription timing fields
    s.start_date,
    s.expires_at,
    s.canceled_at,
    s.paused_at,
    s.suspended_at,

    -- Grace period fields
    s.grace_period_started_at,
    s.grace_period_ends_at,

    -- Payment action required flag
    s.requires_payment_action,

    -- Paddle integration fields
    s.paddle_subscription_id,
    s.paddle_customer_id,
    s.paddle_plan_id,
    s.paddle_checkout_id,

    -- Management URLs from Paddle
    s.cancel_url,
    s.update_url,

    -- Plan details (joined from subscription_plans)
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    sp.currency as plan_currency,
    sp.billing_period,
    sp.features as plan_features,

    -- Timestamps
    s.created_at,
    s.updated_at,
    s.status_updated_at,

    -- Usage data (aggregated from usage_tracking)
    jsonb_build_object(
        'ocrAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'ocr_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false)),
        'riskAnalysis', COALESCE((
            SELECT jsonb_build_object(
                'limit', ut.limit_count,
                'used', ut.used_count,
                'savedCredits', ut.saved_credits_count,
                'resetAt', ut.reset_at,
                'canUse', (ut.used_count < ut.limit_count)
            )
            FROM usage_tracking ut
            WHERE ut.user_id = s.user_id
                AND ut.feature_type = 'risk_analysis'
            ORDER BY ut.created_at DESC
            LIMIT 1
        ), jsonb_build_object('limit', 0, 'used', 0, 'savedCredits', 0, 'resetAt', null, 'canUse', false))
    ) as usage

FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL;

COMMENT ON VIEW public.subscription_status_view IS
'Subscription status with computed grace period logic and plan details.
This view computes effective_status based on grace period, joins subscription plan details,
aggregates usage tracking data, and filters out soft-deleted subscriptions.
Note: This view does NOT use SECURITY DEFINER - RLS policies from underlying tables apply.';

CREATE TABLE public.usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_type text NOT NULL CHECK (feature_type = ANY (ARRAY['ocr_analysis'::text, 'risk_analysis'::text])),
  used_count integer DEFAULT 0,
  limit_count integer NOT NULL,
  reset_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  saved_credits_count integer NOT NULL DEFAULT 0,
  CONSTRAINT usage_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);