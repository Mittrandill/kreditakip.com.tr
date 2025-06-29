-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Banks policies (public read access)
CREATE POLICY "Anyone can view banks" ON public.banks
  FOR SELECT USING (true);

-- Credit types policies (public read access)
CREATE POLICY "Anyone can view credit types" ON public.credit_types
  FOR SELECT USING (true);

-- Credits policies
CREATE POLICY "Users can view own credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credits" ON public.credits
  FOR DELETE USING (auth.uid() = user_id);

-- Payment plans policies
CREATE POLICY "Users can view own payment plans" ON public.payment_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.credits 
      WHERE credits.id = payment_plans.credit_id 
      AND credits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own payment plans" ON public.payment_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.credits 
      WHERE credits.id = payment_plans.credit_id 
      AND credits.user_id = auth.uid()
    )
  );

-- Payment history policies
CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.credits 
      WHERE credits.id = payment_history.credit_id 
      AND credits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own payment history" ON public.payment_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credits 
      WHERE credits.id = payment_history.credit_id 
      AND credits.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
