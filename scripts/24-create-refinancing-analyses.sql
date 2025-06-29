-- Refinansman analizleri tablosu
CREATE TABLE IF NOT EXISTS refinancing_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  total_potential_savings DECIMAL(15,2),
  refinancing_potential TEXT, -- 'Yüksek', 'Orta', 'Düşük'
  urgency_level TEXT, -- 'Acil', 'Yüksek', 'Orta', 'Düşük'
  recommended_strategy TEXT,
  credits_analyzed INTEGER DEFAULT 0,
  market_rates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE refinancing_analyses ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi analizlerini görebilir
CREATE POLICY "Users can view own refinancing analyses" ON refinancing_analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini ekleyebilir
CREATE POLICY "Users can insert own refinancing analyses" ON refinancing_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini güncelleyebilir
CREATE POLICY "Users can update own refinancing analyses" ON refinancing_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi analizlerini silebilir
CREATE POLICY "Users can delete own refinancing analyses" ON refinancing_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_refinancing_analyses_user_id ON refinancing_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_refinancing_analyses_created_at ON refinancing_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refinancing_analyses_potential_savings ON refinancing_analyses(total_potential_savings DESC);
