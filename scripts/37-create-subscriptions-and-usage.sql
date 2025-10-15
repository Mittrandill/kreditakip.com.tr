-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  iyzico_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_tracking table for free tier limits
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('ocr_analysis', 'risk_analysis')),
  used_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type)
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  iyzico_payment_id TEXT,
  iyzico_conversation_id TEXT,
  payment_method TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);

-- Function to initialize free tier for new users
CREATE OR REPLACE FUNCTION initialize_free_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Initialize usage tracking for OCR analysis (1 free analysis)
  INSERT INTO public.usage_tracking (user_id, feature_type, used_count, limit_count)
  VALUES (NEW.id, 'ocr_analysis', 0, 1);
  
  -- Initialize usage tracking for risk analysis (0 for free users)
  INSERT INTO public.usage_tracking (user_id, feature_type, used_count, limit_count)
  VALUES (NEW.id, 'risk_analysis', 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize free tier on user creation
DROP TRIGGER IF EXISTS on_user_created_initialize_free_tier ON public.profiles;
CREATE TRIGGER on_user_created_initialize_free_tier
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_free_tier();

-- Function to check if user can use feature
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_plan TEXT;
  v_used_count INTEGER;
  v_limit_count INTEGER;
BEGIN
  -- Check subscription plan
  SELECT plan_type INTO v_subscription_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Premium users have unlimited access
  IF v_subscription_plan = 'premium' THEN
    RETURN TRUE;
  END IF;
  
  -- Check usage for free users
  SELECT used_count, limit_count INTO v_used_count, v_limit_count
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND feature_type = p_feature_type;
  
  -- Return true if under limit
  RETURN (v_used_count < v_limit_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_use BOOLEAN;
BEGIN
  -- Check if user can use feature
  v_can_use := can_use_feature(p_user_id, p_feature_type);
  
  IF NOT v_can_use THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage count
  UPDATE public.usage_tracking
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND feature_type = p_feature_type;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
