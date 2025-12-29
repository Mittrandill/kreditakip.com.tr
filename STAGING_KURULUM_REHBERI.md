# 🏗️ Staging Ortamı Kurulum Rehberi
## Adım Adım - 30 Dakikada Tamamlayın

**Production Proje:** oymjjceuiotxfbpwsdym.supabase.co
**Hedef:** Güvenli test ortamı oluşturmak

---

## 📋 ADIM 1: Yeni Supabase Projesi Oluştur (5 dakika)

### 1.1. Supabase Dashboard'a Git

```
https://supabase.com/dashboard
```

### 1.2. "New Project" Butonuna Tıkla

- **Organization:** Mevcut organization'ınızı seçin
- **Name:** `kreditakip-staging` (veya istediğiniz bir isim)
- **Database Password:** Güçlü bir şifre oluşturun (bunu NOT ALIN!)
- **Region:** `Europe (eu-central-1)` (production ile aynı bölge)
- **Pricing Plan:** Free (test için yeterli)

### 1.3. "Create new project" butonuna tıklayın

⏱️ Proje oluşturulması ~2 dakika sürer. Bekleyin...

---

## 📋 ADIM 2: Production Verilerini Staging'e Kopyala (10 dakika)

### 2.1. Production'dan Backup Al

**Yöntem 1: Supabase Dashboard (Önerilen)**

1. Production projenize gidin: https://supabase.com/dashboard/project/oymjjceuiotxfbpwsdym
2. Sol menüden **Database** → **Backups** seçin
3. En son otomatik backup'ı bulun
4. "Download" butonuna tıklayın (.sql dosyası indirilecek)

**VEYA Yöntem 2: SQL Dump (Manuel)**

```sql
-- Production'da çalıştırın (SQL Editor'de)
-- Tüm şemayı görmek için:
SELECT
  table_schema,
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC;
```

### 2.2. Staging'e Restore Et

**Seçenek A: Backup dosyası varsa**

1. Staging projenize gidin
2. **Database** → **Backups** sekmesine gidin
3. "Restore from file" seçeneğini kullanın (eğer varsa)

**Seçenek B: SQL ile manuel import (daha kolay)**

```sql
-- Staging projenizde SQL Editor'ü açın
-- Aşağıdaki tablolarla başlayalım (veri olmadan sadece yapı):

-- 1. profiles tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  avatar_url text,
  theme text DEFAULT 'light'::text,
  is_admin boolean DEFAULT false,
  email_monthly_summary boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Test kullanıcısı oluştur
-- (Auth kullanıcısı Supabase Dashboard'dan oluşturun)
-- Email: test@staging.com
-- Password: TestStaging123!

-- Ardından profil ekleyin:
INSERT INTO profiles (id, first_name, last_name, email, is_admin)
VALUES (
  '<auth-user-uuid>',  -- Dashboard'dan kopyalayın
  'Test',
  'User',
  'test@staging.com',
  true
);
```

**🎯 DİKKAT:** Production'daki TÜM verileri kopyalamak yerine, sadece şemayı (tablo yapılarını) kopyalayacağız. Test için yeterli.

---

## 📋 ADIM 3: Staging Environment Variables Ayarla (5 dakika)

### 3.1. Staging Credentials Al

Staging projenizde:
1. **Settings** → **API** sekmesine gidin
2. Şunları kopyalayın:
   - `URL`
   - `anon public key`
   - `service_role key` (Show'a tıklayın)

### 3.2. .env.staging Dosyası Oluştur

```bash
# Proje klasöründe çalıştırın:
cat > .env.staging << 'EOF'
# Staging Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=<staging-url-buraya>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key-buraya>
SERVICE_ROLE_KEY=<staging-service-role-key-buraya>

# Cron Secret (test için basit)
CRON_SECRET=staging-test-secret-123

# PayTR Test Credentials (varsa)
PAYTR_MERCHANT_ID=test
PAYTR_MERCHANT_KEY=test
PAYTR_MERCHANT_SALT=test

# Paddle Test Mode
PADDLE_ENVIRONMENT=sandbox
EOF
```

**Örnek (doldurulmuş):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SERVICE_ROLE_KEY=eyJhbGc...
CRON_SECRET=staging-test-secret-123
```

### 3.3. Git'te Staging Branch Oluştur

```bash
# Staging branch oluştur
git checkout -b staging/database-migration

# Environment dosyasını ekle (dikkat: .env.staging gitignore'da değil!)
git add .env.staging

# Şimdilik commit etmeyin, önce testleri tamamlayalım
```

---

## 📋 ADIM 4: Supabase CLI'yı Staging'e Bağla (5 dakika)

### 4.1. Supabase Login

```bash
# Tarayıcı açılacak, giriş yapın
npx supabase login
```

### 4.2. Staging Projeyi Link Et

```bash
# Staging klasörü oluştur
mkdir -p supabase-staging
cd supabase-staging

# Projeyi link et
npx supabase link --project-ref <staging-project-ref>

# Örnek:
# npx supabase link --project-ref xyzabc123
```

**Project ref nereden bulunur?**
- Staging Supabase Dashboard URL'sine bakın:
- `https://supabase.com/dashboard/project/[PROJECT-REF]`
- PROJECT-REF kısmını kopyalayın

### 4.3. Bağlantıyı Test Et

```bash
npx supabase db dump --schema public
```

✅ Eğer tablolar listelenirse bağlantı başarılı!

---

## 📋 ADIM 5: Migrasyonları Staging'e Uygula (5 dakika)

### 5.1. Migration Dosyalarını Staging'e Kopyala

```bash
# Ana klasöre dönün
cd ..

# Migration dosyalarını kopyalayın
cp supabase/migrations/20251229*.sql supabase-staging/migrations/
```

### 5.2. Migrasyon 1'i Uygula (accounts/credit_cards)

```bash
# Staging klasörüne git
cd supabase-staging

# Migrasyon 1'i çalıştır
npx supabase db push
```

**VEYA Manual olarak:**

Staging Dashboard → SQL Editor → Dosyayı yapıştır:
```sql
-- supabase/migrations/20251229000001_add_missing_tables.sql içeriğini
-- kopyalayıp SQL Editor'e yapıştırın ve çalıştırın
```

### 5.3. Migrasyon 3'ü Uygula (webhook cleanup)

Aynı şekilde:
```sql
-- supabase/migrations/20251229000003_add_paytr_webhook_cleanup.sql
```

### 5.4. Doğrulama

```sql
-- Staging SQL Editor'de çalıştırın:

-- Yeni tabloları kontrol et
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('accounts', 'credit_cards', 'cleanup_jobs')
ORDER BY table_name;

-- Beklenen: 3 satır (accounts, cleanup_jobs, credit_cards)
```

---

## ✅ TAMAMLANDI MI KONTROL LİSTESİ

Aşağıdakileri kontrol edin:

- [ ] Staging Supabase projesi oluşturuldu
- [ ] Staging'de temel tablolar var (profiles, subscriptions, vb.)
- [ ] .env.staging dosyası oluşturuldu ve credentials doğru
- [ ] Supabase CLI staging'e bağlandı
- [ ] Migrasyon 1 başarıyla uygulandı (accounts, credit_cards)
- [ ] Migrasyon 3 başarıyla uygulandı (cleanup_jobs)
- [ ] Test kullanıcısı oluşturuldu

---

## 🚨 SORUN GİDERME

### Hata: "relation does not exist"

**Çözüm:** Production şemasını tam kopyalayamadık. Manuel olarak eksik tabloları oluşturun:

```sql
-- database.sql dosyasının tamamını staging'e kopyalayın
-- Veya sadece temel tabloları:
```

Bana **"database.sql'i staging'e yükle"** derseniz size komple script veririm.

### Hata: "permission denied"

**Çözüm:** SERVICE_ROLE_KEY kullanarak bağlandığınızdan emin olun.

---

## 📞 BANA NE ZAMAN DÖNMELİSİNİZ?

Yukarıdaki adımları tamamladıktan sonra bana şunu söyleyin:

**"Staging hazır, testlere başlayalım"**

Ben de:
1. ✅ Kod değişikliklerini staging'e deploy edeceğim
2. ✅ Tüm testleri çalıştıracağım
3. ✅ Sonuçları raporlayacağım

---

**Tahmini Süre:** 30-45 dakika
**Zorluk:** Orta
**Yardım:** Her adımda takıldığınızda bana yazın!

Başlayın ve ilerlemenizi bildirin! 🚀
