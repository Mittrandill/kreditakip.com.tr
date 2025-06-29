-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS public.banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit types table
CREATE TABLE IF NOT EXISTS public.credit_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credits table
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  bank_id UUID REFERENCES public.banks(id) NOT NULL,
  credit_type_id UUID REFERENCES public.credit_types(id) NOT NULL,
  credit_code TEXT NOT NULL,
  account_number TEXT,
  initial_amount DECIMAL(15,2) NOT NULL,
  remaining_debt DECIMAL(15,2) NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  last_payment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'overdue')),
  payment_progress DECIMAL(5,2) DEFAULT 0,
  remaining_installments INTEGER DEFAULT 0,
  total_installments INTEGER DEFAULT 0,
  overdue_days INTEGER DEFAULT 0,
  collateral TEXT,
  insurance_status TEXT DEFAULT 'active',
  branch_name TEXT,
  customer_number TEXT,
  credit_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID REFERENCES public.credits(id) NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_payment DECIMAL(15,2) NOT NULL,
  remaining_debt DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_date DATE,
  payment_channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID REFERENCES public.credits(id) NOT NULL,
  payment_plan_id UUID REFERENCES public.payment_plans(id),
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_channel TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  credit_id UUID REFERENCES public.credits(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON public.credits(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_credit_id ON public.payment_plans(credit_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_due_date ON public.payment_plans(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_credit_id ON public.payment_history(credit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
