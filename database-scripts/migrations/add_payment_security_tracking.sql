-- Add IP address and device tracking to paytr_recurring_payments
ALTER TABLE public.paytr_recurring_payments
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS device_fingerprint text,
ADD COLUMN IF NOT EXISTS risk_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags jsonb DEFAULT '[]'::jsonb;

-- Create payment_security_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS public.payment_security_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  payment_id uuid,
  event_type character varying NOT NULL, -- 'payment_attempt', 'payment_success', 'payment_failed', 'suspicious_activity'
  ip_address inet NOT NULL,
  user_agent text,
  device_fingerprint text,
  browser_info jsonb DEFAULT '{}'::jsonb, -- {browser, os, device, screen_resolution}
  location_info jsonb DEFAULT '{}'::jsonb, -- {country, city, timezone}
  risk_score numeric DEFAULT 0,
  risk_factors jsonb DEFAULT '[]'::jsonb, -- Array of risk indicators
  session_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT payment_security_logs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT payment_security_logs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.paytr_recurring_payments(id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_security_logs_user_id ON public.payment_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_security_logs_ip_address ON public.payment_security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_payment_security_logs_created_at ON public.payment_security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_security_logs_event_type ON public.payment_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_security_logs_risk_score ON public.payment_security_logs(risk_score DESC);

-- Create chargeback tracking table
CREATE TABLE IF NOT EXISTS public.payment_chargebacks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  payment_id uuid,
  merchant_oid character varying NOT NULL,
  chargeback_date timestamp with time zone NOT NULL,
  chargeback_reason character varying NOT NULL, -- 'unauthorized', 'fraud', 'service_not_provided', 'duplicate', 'other'
  chargeback_amount numeric NOT NULL,
  currency character varying DEFAULT 'TRY'::character varying,
  status character varying NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'disputed', 'won', 'lost'
  resolution_date timestamp with time zone,
  dispute_evidence jsonb DEFAULT '{}'::jsonb, -- Evidence submitted for dispute
  notes text,
  paytr_reference character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT payment_chargebacks_pkey PRIMARY KEY (id),
  CONSTRAINT payment_chargebacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT payment_chargebacks_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.paytr_recurring_payments(id)
);

-- Create index for chargeback tracking
CREATE INDEX IF NOT EXISTS idx_payment_chargebacks_user_id ON public.payment_chargebacks(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_chargebacks_merchant_oid ON public.payment_chargebacks(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_payment_chargebacks_status ON public.payment_chargebacks(status);
CREATE INDEX IF NOT EXISTS idx_payment_chargebacks_created_at ON public.payment_chargebacks(created_at DESC);

-- Create fraud_detection_rules table for configurable fraud rules
CREATE TABLE IF NOT EXISTS public.fraud_detection_rules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rule_name character varying NOT NULL UNIQUE,
  rule_type character varying NOT NULL, -- 'velocity', 'amount', 'location', 'device', 'behavior'
  rule_config jsonb NOT NULL, -- Configuration for the rule
  risk_score_impact numeric NOT NULL DEFAULT 10, -- How much this rule adds to risk score
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT fraud_detection_rules_pkey PRIMARY KEY (id)
);

-- Insert default fraud detection rules
INSERT INTO public.fraud_detection_rules (rule_name, rule_type, rule_config, risk_score_impact, is_active) VALUES
  ('inactive_user_payment', 'behavior', '{"days_inactive": 30, "description": "User has not logged in for 30+ days"}', 25, true),
  ('multiple_failed_attempts', 'velocity', '{"max_failures": 3, "time_window_hours": 24, "description": "Multiple failed payment attempts"}', 30, true),
  ('high_amount', 'amount', '{"threshold": 1000, "description": "Payment amount exceeds threshold"}', 15, true),
  ('new_user_large_payment', 'behavior', '{"days_registered": 7, "amount_threshold": 500, "description": "New user with large payment"}', 20, true),
  ('ip_location_mismatch', 'location', '{"description": "IP location differs from billing address"}', 10, true),
  ('multiple_cards_same_ip', 'device', '{"max_cards": 3, "time_window_hours": 24, "description": "Multiple different cards from same IP"}', 20, true),
  ('vpn_detected', 'location', '{"description": "VPN or proxy usage detected"}', 15, true);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payment_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_security_logs
CREATE POLICY "Service role can manage security logs" ON public.payment_security_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for payment_chargebacks
CREATE POLICY "Service role can manage chargebacks" ON public.payment_chargebacks
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for fraud_detection_rules
CREATE POLICY "Service role can manage fraud rules" ON public.fraud_detection_rules
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE public.payment_security_logs IS 'Detailed security logging for all payment-related events';
COMMENT ON TABLE public.payment_chargebacks IS 'Chargeback tracking and dispute management';
COMMENT ON TABLE public.fraud_detection_rules IS 'Configurable fraud detection rules and risk scoring';
COMMENT ON COLUMN public.paytr_recurring_payments.ip_address IS 'IP address of the user during payment';
COMMENT ON COLUMN public.paytr_recurring_payments.device_fingerprint IS 'Unique device identifier for fraud detection';
COMMENT ON COLUMN public.paytr_recurring_payments.risk_score IS 'Calculated fraud risk score (0-100)';
