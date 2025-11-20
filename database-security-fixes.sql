-- Security Fixes: Enable RLS and set proper policies
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active subscription plans (needed for pricing page)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Policy: Only admins can modify subscription plans
CREATE POLICY "Only admins can modify subscription plans"
ON public.subscription_plans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 2. Enable RLS on request_logs table
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own request logs
CREATE POLICY "Users can view their own request logs"
ON public.request_logs
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Only admins can view all logs
CREATE POLICY "Admins can view all request logs"
ON public.request_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: System can insert logs (for logging purposes)
CREATE POLICY "System can insert request logs"
ON public.request_logs
FOR INSERT
WITH CHECK (true);

-- 3. Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscription_plans', 'request_logs');
