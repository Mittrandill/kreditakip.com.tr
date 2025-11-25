-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  read_time INTEGER, -- in minutes
  views INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add admin flag to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- Enable Row Level Security
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog Categories Policies
-- Anyone can read published categories
CREATE POLICY "Anyone can view blog categories"
  ON public.blog_categories FOR SELECT
  USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can insert blog categories"
  ON public.blog_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update categories
CREATE POLICY "Only admins can update blog categories"
  ON public.blog_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete categories
CREATE POLICY "Only admins can delete blog categories"
  ON public.blog_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Blog Posts Policies
-- Anyone can view published posts
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert posts
CREATE POLICY "Only admins can insert blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update posts
CREATE POLICY "Only admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete posts
CREATE POLICY "Only admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger to update updated_at timestamp for blog_categories
CREATE OR REPLACE FUNCTION update_blog_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_category_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_category_updated_at();

-- Create trigger to update updated_at timestamp for blog_posts
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_post_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Seed initial blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Finans İpuçları', 'finans-ipuclari', 'Kişisel finans yönetimi ve tasarruf ipuçları'),
  ('Teknoloji', 'teknoloji', 'Finansal teknoloji ve yenilikler'),
  ('Planlama', 'planlama', 'Finansal planlama ve hedef belirleme'),
  ('Eğitim', 'egitim', 'Finansal okuryazarlık ve eğitim içerikleri'),
  ('Güvenlik', 'guvenlik', 'Dijital güvenlik ve gizlilik')
ON CONFLICT (slug) DO NOTHING;
