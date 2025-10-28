# Newsletter Subscribers Tablosunu Oluşturma

Newsletter abonelik sistemi için veritabanı tablosunu oluşturmanız gerekiyor.

## Adımlar

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**: `kreditakip.com.tr` projesini açın
3. **SQL Editor'ü açın**: Sol menüden "SQL Editor" seçeneğine tıklayın
4. **Yeni sorgu oluşturun**: "New query" butonuna tıklayın
5. **Aşağıdaki SQL kodunu yapıştırın**:

\`\`\`sql
-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- Add RLS policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow service role (API) to do everything
CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access
CREATE POLICY "Public can read newsletter subscribers"
  ON newsletter_subscribers
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert
CREATE POLICY "Public can insert newsletter subscribers"
  ON newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public update
CREATE POLICY "Public can update newsletter subscribers"
  ON newsletter_subscribers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
\`\`\`

6. **Çalıştırın**: "Run" butonuna tıklayın
7. **Başarılı mesajını kontrol edin**: "Success. No rows returned" mesajını görmelisiniz

## Doğrulama

Tablonun oluşturulduğunu doğrulamak için:
1. Sol menüden "Table Editor" seçeneğine tıklayın
2. `newsletter_subscribers` tablosunu görmelisiniz

## Sorun Giderme

Eğer hata alırsanız:
- Zaten çalıştırdıysanız, "already exists" hatası normaldir
- Başka bir hata alırsanız, SQL kodunu tekrar kontrol edin
- Hala sorun varsa, mevcut `newsletter_subscribers` tablosunu silin ve tekrar deneyin
