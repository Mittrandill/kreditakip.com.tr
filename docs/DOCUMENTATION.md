# Kredi Takip - Akıllı Kredi Yönetim Platformu

## Genel Bakış

**Kredi Takip**, kullanıcıların tüm kredilerini tek bir platformdan yönetmelerine, ödeme planları oluşturmalarına ve finansal durumlarını detaylı olarak analiz etmelerine olanak sağlayan modern bir SaaS uygulamasıdır.

### Ana Hedefler
- Kredi yönetimini basitleştirmek
- Ödeme takibini otomatikleştirmek
- Finansal sağlık analizi sağlamak
- PDF ekstreleri OCR ile otomatik okuma
- Yapay zeka destekli finansal öneriler

---

## Teknoloji Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI (Headless UI)
- **Icons**: Lucide React
- **Charts**: Recharts, ApexCharts, Chart.js
- **Animations**: Framer Motion
- **Form Management**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Client
- **Authentication**: Supabase Auth

### Ödeme & Entegrasyonlar
- **Payment Gateway**: Paddle (PCI-DSS uyumlu)
- **Email Service**: MailerSend
- **AI**: Google Generative AI (Gemini)
- **OCR**: Custom PDF parsing with AI

### DevOps & Monitoring
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Speed Insights**: Vercel Speed Insights

---

## Özellikler

### 1. Kredi Yönetimi
- Kredi ekleme, düzenleme, silme
- Çoklu kredi türü desteği (Tüketici, Konut, Taşıt, İhtiyaç, vb.)
- Banka bilgileri ve logo entegrasyonu
- Kredi durumu takibi (Aktif, Kapalı, Gecikmiş)
- Ödeme ilerleme takibi
- Gecikme gün hesaplama

### 2. Ödeme Planlama
- Otomatik ödeme planı oluşturma
- Aylık taksit hesaplama
- Kalan borç takibi
- Ödeme tarihi hatırlatmaları
- PDF ödeme planı çıktısı

### 3. OCR & PDF İşleme
- Kredi ekstresi PDF yükleme
- Yapay zeka destekli metin çıkarma
- Otomatik kredi bilgisi algılama
- Çoklu sayfa desteği

### 4. Finansal Analiz & Raporlama
- Dashboard özet kartları
- Aylık ödeme trendi grafiği
- Banka bazında borç dağılımı
- Kredi türü dağılımı
- PDF rapor çıktısı

### 5. Risk Analizi
- Kredi risk skoru hesaplama
- Faiz oranı analizi
- Borç/gelir oranı değerlendirmesi
- AI destekli risk önerileri
- Refinansman önerileri

### 6. Bildirim Sistemi
- Ödeme hatırlatmaları
- Email bildirimleri
- Sistem bildirimleri
- Gecikme uyarıları
- Cron job ile otomatik bildirim

### 7. Premium Özellikler (Paddle ile)
- Abonelik sistemi (Free, Pro, Premium)
- Sınırsız kredi ekleme
- Gelişmiş raporlar
- Refinansman analizi
- Finansal sağlık analizi
- PDF rapor indirme

### 8. Kullanıcı Yönetimi
- Email/şifre ile kayıt
- Email doğrulama
- Şifre sıfırlama
- Profil düzenleme
- Avatar yükleme
- Güvenlik ayarları

### 9. Admin Panel
- Kullanıcı yönetimi
- Abonelik yönetimi
- İşlem geçmişi
- Blog yönetimi
- Dashboard istatistikleri

### 10. Blog & İçerik
- Blog yazı yönetimi
- Kategori sistemi
- SEO optimizasyonu
- Markdown desteği

### 11. Diğer Özellikler
- Dark/Light tema desteği
- Responsive tasarım
- PWA desteği
- Şifre yöneticisi
- Hesap makinesi araçları
- SSS sayfası
- İletişim formu

---

## Proje Yapısı

```
kreditakip.com.tr/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth grubu
│   │   ├── giris/               # Login sayfası
│   │   ├── kayit-ol/            # Register sayfası
│   │   └── sifremi-unuttum/     # Forgot password
│   ├── admin/                    # Admin panel
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin APIs
│   │   ├── paddle/              # Paddle webhooks
│   │   ├── subscription/        # Subscription APIs
│   │   ├── user/                # User APIs
│   │   ├── notifications/       # Notification APIs
│   │   ├── analyze-pdf/         # OCR API
│   │   └── risk-analysis/       # Risk analysis API
│   ├── blog/                     # Public blog
│   └── uygulama/                 # Main application
│       ├── ana-sayfa/           # Dashboard
│       ├── krediler/            # Credits management
│       ├── raporlar/            # Reports
│       ├── risk-analizi/        # Risk analysis
│       ├── bildirimler/         # Notifications
│       ├── ayarlar/             # Settings
│       └── premium/             # Premium upgrade
├── components/                   # React components
│   ├── ui/                      # Radix UI components
│   ├── layout/                  # Layout components
│   ├── payment/                 # Paddle payment components
│   └── charts/                  # Chart components
├── lib/                          # Utilities
│   ├── api/                     # API functions
│   ├── email/                   # Email templates
│   ├── utils/                   # Helper functions
│   └── supabase/                # Supabase client
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── supabase/                     # Supabase files
│   └── migrations/              # Database migrations
└── docs/                         # Documentation
```

---

## Veritabanı Modeli

### Ana Tablolar

#### profiles
Kullanıcı profil bilgileri
- `id` (UUID, PK): Kullanıcı ID
- `first_name`, `last_name`: Ad Soyad
- `email`, `phone`: İletişim bilgileri
- `avatar_url`: Avatar URL
- `is_admin`: Admin mi
- `email_monthly_summary`: Aylık özet emaili
- `email_weekly_summary`: Haftalık özet emaili

#### credits
Kredi kayıtları
- `id` (UUID, PK): Kredi ID
- `user_id` (FK → profiles): Kullanıcı
- `bank_id` (FK → banks): Banka
- `credit_type_id` (FK → credit_types): Kredi türü
- `initial_amount`, `remaining_debt`: Tutarlar
- `monthly_payment`, `interest_rate`: Ödeme bilgileri
- `status`: active | closed | overdue

#### subscriptions
Abonelik bilgileri (Paddle entegrasyonlu)
- `id` (UUID, PK): Abonelik ID
- `user_id` (FK → profiles): Kullanıcı
- `plan_type`: free | premium
- `plan_id`: free | pro-monthly | pro-yearly | premium-monthly | premium-yearly
- `status`: active | cancelled | expired | paused | trialing
- `paddle_subscription_id`: Paddle subscription ID
- `paddle_customer_id`: Paddle customer ID
- `start_date`, `expires_at`: Tarihler
- `cancel_url`, `update_url`: Paddle yönetim linkleri

#### subscription_plans
Abonelik planları
- `id` (text, PK): Plan ID (free, pro-monthly, vb.)
- `name`, `description`: Plan bilgileri
- `price`, `currency`: Fiyat
- `billing_period`: monthly | yearly
- `paddle_product_id`, `paddle_price_id`: Paddle ID'leri
- `features`: Plan özellikleri (JSONB)

#### paddle_customers
Paddle müşteri eşleştirmesi
- `user_id` (FK → auth.users): Kullanıcı
- `paddle_customer_id`: Paddle customer ID
- `email`, `name`: Müşteri bilgileri

#### paddle_webhook_events
Paddle webhook logları
- `event_id`: Paddle event ID
- `event_type`: Event türü
- `event_data`: Event verisi (JSONB)
- `processed`: İşlendi mi

#### payment_plans
Ödeme planları
- `credit_id` (FK → credits): Kredi
- `installment_number`: Taksit no
- `due_date`: Vade tarihi
- `total_payment`, `remaining_debt`: Tutarlar
- `status`: paid | pending | overdue

#### notifications
Bildirimler
- `user_id` (FK → profiles): Kullanıcı
- `title`, `message`: İçerik
- `type`: info | warning | error | success
- `is_read`: Okundu mu
- `notification_type`: app | email

#### subscription_usage
Özellik kullanım takibi
- `user_id`, `subscription_id`: İlişkiler
- `feature_type`: ocr_analysis | risk_analysis
- `usage_count`, `limit_count`: Kullanım
- `saved_credits_count`, `saved_credits_limit`: Kaydedilen kredi limiti
- `reset_at`: Sıfırlanma tarihi

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/logout` - Çıkış yap
- `POST /api/auth/reset-password` - Şifre sıfırla

### Credits
- `GET /api/credits` - Kredileri listele
- `POST /api/credits` - Kredi ekle
- `PUT /api/credits/:id` - Kredi güncelle
- `DELETE /api/credits/:id` - Kredi sil

### Subscriptions (Paddle)
- `GET /api/subscription/status` - Abonelik durumu
- `POST /api/paddle/webhooks` - Paddle webhook handler
- `POST /api/subscription/cancel` - İptal et

### Notifications
- `GET /api/notifications` - Bildirimleri getir
- `POST /api/notifications/send-reminders` - Hatırlatma gönder

### Admin
- `GET /api/admin/users` - Kullanıcıları listele
- `GET /api/admin/subscriptions` - Abonelikleri listele

---

## Kurulum

### Gereksinimler
- Node.js 20.x veya üstü
- pnpm (önerilen) veya npm
- Supabase hesabı
- Paddle hesabı

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repo-url>
cd kreditakip.com.tr
```

2. **Bağımlılıkları yükleyin**
```bash
pnpm install
```

3. **Environment variables (.env.local)**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paddle
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
PADDLE_API_KEY=your_paddle_api_key
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_WEBHOOK_SECRET=your_webhook_secret

# Email
MAILERSEND_API_KEY=your_mailersend_key

# AI
GOOGLE_AI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Geliştirme sunucusunu başlatın**
```bash
pnpm dev
```

---

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint check
```

---

## Güvenlik

- Row Level Security (Supabase RLS)
- API route protection
- CSRF protection
- XSS prevention
- SQL injection protection
- PCI-DSS uyumlu ödeme (Paddle)
- Webhook signature verification

---

## Deployment

### Vercel (Önerilen)
1. GitHub repository bağlayın
2. Environment variables ekleyin
3. Deploy edin

---

## Destek

- Website: https://kreditakip.com.tr
- Email: info@kreditakip.com.tr

---

**Son Güncelleme**: 2025-12-05
**Versiyon**: 1.0.0
