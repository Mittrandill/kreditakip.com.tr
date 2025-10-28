# KrediTakip - Kredi Yönetim Platformu

OCR teknolojisi ve yapay zeka ile kredilerinizi profesyonel seviyede yönetin.

## 🚀 Özellikler

- **OCR Teknolojisi**: Kredi döküm belgelerini otomatik olarak analiz edin
- **Yapay Zeka Destekli Analiz**: Gemini AI ile akıllı kredi önerileri
- **Ödeme Takibi**: Taksit ödemelerinizi takip edin ve hatırlatmalar alın
- **Finansal Raporlar**: Detaylı kredi analizi ve raporlama
- **Güvenli Ödeme**: Iyzico entegrasyonu ile güvenli abonelik ödemeleri
- **E-posta Bildirimleri**: Mailjet ile otomatik bildirimler

## 📋 Gereksinimler

- Node.js 18+
- Supabase hesabı
- Mailjet hesabı
- Iyzico hesabı (ödeme için)
- Gemini API anahtarı (AI analiz için)

## 🛠️ Kurulum

1. Repoyu klonlayın:
\`\`\`bash
git clone https://github.com/yourusername/kreditakip.git
cd kreditakip
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
\`\`\`

3. Environment variables'ları ayarlayın:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. `.env.local` dosyasını düzenleyin:
\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SERVICE_ROLE_KEY=your_service_role_key

# Mailjet
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key

# Iyzico
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_character_encryption_key
CRON_SECRET=your_cron_secret
\`\`\`

5. Veritabanı migration'larını çalıştırın:
\`\`\`bash
# Supabase SQL Editor'de scripts/ klasöründeki SQL dosyalarını sırayla çalıştırın
\`\`\`

6. Development server'ı başlatın:
\`\`\`bash
npm run dev
\`\`\`

## 📧 E-posta Entegrasyonu

Uygulama Mailjet kullanarak e-posta gönderir:

- **İletişim Formu**: `/iletisim` sayfasından gelen mesajlar
- **Bülten Aboneliği**: Footer'daki bülten kayıt formu
- **Fatura Bildirimleri**: Abonelik ödemesi bildirimleri
- **Ödeme Hatırlatmaları**: Taksit ödeme hatırlatmaları

Detaylı bilgi için [MAILJET_SETUP.md](./MAILJET_SETUP.md) dosyasına bakın.

## 🗄️ Veritabanı

Supabase PostgreSQL kullanılmaktadır. Ana tablolar:

- `profiles` - Kullanıcı profilleri
- `credits` - Kredi bilgileri
- `payment_plans` - Taksit ödeme planları
- `banks` - Banka bilgileri
- `subscriptions` - Kullanıcı abonelikleri
- `newsletter_subscribers` - Bülten aboneleri
- `notifications` - Bildirim geçmişi

## 🔒 Güvenlik

- Row Level Security (RLS) politikaları aktif
- Şifreli veri saklama
- HTTPS zorunlu
- KVKK uyumlu veri işleme
- Güvenli ödeme entegrasyonu

## 🚀 Deployment

### Vercel'e Deploy

1. Vercel hesabınıza giriş yapın
2. GitHub reposunu bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

### Environment Variables

Vercel dashboard'da aşağıdaki environment variables'ları ekleyin:
- Tüm `.env.local` dosyasındaki değişkenler
- Production URL'lerini güncelleyin

## 📱 API Endpoints

### Contact Form
\`\`\`
POST /api/contact
\`\`\`

### Newsletter
\`\`\`
POST /api/newsletter/subscribe
\`\`\`

### Payment
\`\`\`
POST /api/payment/initialize
POST /api/payment/checkout/initialize
POST /api/payment/checkout/callback
\`\`\`

### Notifications
\`\`\`
POST /api/notifications/send-reminders
GET /api/notifications/cron
\`\`\`

## 🧪 Test

\`\`\`bash
# Test mode'u aktif edin
TEST_MODE=true
TEST_EMAIL=your-test-email@example.com

# E-posta testi
npm run test:email
\`\`\`

## 📄 Lisans

Bu proje özel bir lisans altındadır. Tüm hakları saklıdır.

## 🤝 Destek

- E-posta: info@kreditakip.com.tr
- Telefon: +90 543 203 53 09
- Web: https://kreditakip.com.tr

## 🔄 Güncellemeler

### v2.1.0 (Ocak 2025)
- ✅ Mailjet e-posta entegrasyonu
- ✅ İletişim formu API'si
- ✅ Bülten abonelik sistemi
- ✅ Geliştirilmiş bildirim sistemi
- ✅ Responsive tasarım iyileştirmeleri

### v2.0.0 (Aralık 2024)
- ✅ OCR teknolojisi entegrasyonu
- ✅ Gemini AI analiz sistemi
- ✅ Iyzico ödeme entegrasyonu
- ✅ Abonelik yönetimi
- ✅ Bildirim sistemi
