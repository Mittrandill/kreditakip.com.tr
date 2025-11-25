-- Risk analizleri tablosu oluştur
CREATE TABLE IF NOT EXISTS public.risk_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analiz sonuçları (JSON olarak saklayacağız)
    analysis_data JSONB NOT NULL,
    
    -- Analiz özet bilgileri (hızlı erişim için)
    overall_risk_score TEXT,
    overall_risk_color TEXT,
    debt_to_income_ratio TEXT,
    
    -- Analiz sırasındaki finansal durum özeti
    monthly_income DECIMAL(15,2),
    monthly_expenses DECIMAL(15,2),
    total_assets DECIMAL(15,2),
    total_credits_count INTEGER DEFAULT 0,
    total_debt_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Meta bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE public.risk_analyses ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi analizlerini görebilir
CREATE POLICY "Users can view own risk analyses" ON public.risk_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini ekleyebilir
CREATE POLICY "Users can insert own risk analyses" ON public.risk_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini güncelleyebilir
CREATE POLICY "Users can update own risk analyses" ON public.risk_analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini silebilir
CREATE POLICY "Users can delete own risk analyses" ON public.risk_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_risk_analyses_updated_at
    BEFORE UPDATE ON public.risk_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Index'ler
CREATE INDEX IF NOT EXISTS risk_analyses_user_id_idx ON public.risk_analyses(user_id);
CREATE INDEX IF NOT EXISTS risk_analyses_created_at_idx ON public.risk_analyses(created_at DESC);
