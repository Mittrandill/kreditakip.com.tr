# Kredi Takip - Akıllı Kredi Yönetim Platformu

## 📋 İçindekiler
- [Genel Bakış](#genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Özellikler](#özellikler)
- [Proje Yapısı](#proje-yapısı)
- [Veritabanı Modeli](#veritabanı-modeli)
- [API Endpoints](#api-endpoints)
- [Kullanıcı Arayüzü](#kullanıcı-arayüzü)
- [Kurulum](#kurulum)
- [Geliştirme](#geliştirme)

---

## 🎯 Genel Bakış

**Kredi Takip**, kullanıcıların tüm kredilerini tek bir platformdan yönetmelerine, ödeme planları oluşturmalarına ve finansal durumlarını detaylı olarak analiz etmelerine olanak sağlayan modern bir SaaS uygulamasıdır.

### Ana Hedefler
- Kredi yönetimini basitleştirmek
- Ödeme takibini otomatikleştirmek
- Finansal finansal sağlık analizi sağlamak
- PDF ekstreleri OCR ile otomatik okuma
- Yapay zeka destekli finansal öneriler

---

## 🛠 Teknoloji Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI (Headless UI)
- **Icons**: Lucide React
- **Charts**:
  - Recharts
  - ApexCharts
  - Chart.js
- **Animations**: Framer Motion
- **Form Management**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Neon Postgres (Serverless)
- **ORM**: Supabase Client
- **Authentication**: Supabase Auth

### Payment & Integrations
- **Payment Gateway**: Iyzipay
- **Email Service**:
  - MailerSend
  - Mailjet
- **AI**: Google Generative AI (Gemini)
- **OCR**: Custom PDF parsing with AI

### DevOps & Monitoring
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Speed Insights**: Vercel Speed Insights

---

## ✨ Özellikler

### 1. Kredi Yönetimi
- ✅ Kredi ekleme, düzenleme, silme
- ✅ Çoklu kredi türü desteği (Tüketici, Konut, Taşıt, İhtiyaç, vb.)
- ✅ Banka bilgileri ve logo entegrasyonu
- ✅ Kredi durumu takibi (Aktif, Kapalı, Gecikmiş)
- ✅ Ödeme ilerleme takibi
- ✅ Gecikme gün hesaplama
- ✅ Teminat ve sigorta bilgileri

### 2. Ödeme Planlama
- ✅ Otomatik ödeme planı oluşturma
- ✅ Aylık taksit hesaplama
- ✅ Kalan borç takibi
- ✅ Ödeme tarihi hatırlatmaları
- ✅ Yaklaşan ödemeler listesi
- ✅ Geçmiş ödemeler arşivi
- ✅ PDF ödeme planı çıktısı

### 3. OCR & PDF İşleme
- ✅ Kredi ekstresi PDF yükleme
- ✅ Yapay zeka destekli metin çıkarma
- ✅ Otomatik kredi bilgisi algılama
- ✅ Çoklu sayfa desteği
- ✅ Hata düzeltme önerileri

### 4. Finansal Analiz & Raporlama
- ✅ **Dashboard**:
  - Toplam borç özeti
  - Aylık ödeme tutarı
  - Kredi performans metrikleri
  - Ortalama faiz oranı
  - Aktif kredi listesi
  - Yaklaşan ödemeler
  - Kredi türü dağılımı (Donut chart)

- ✅ **Raporlar Sayfası**:
  - **Genel Bakış**:
    - Toplam kredi sayısı
    - Toplam borç trendi
    - Ortalama faiz analizi
    - Banka bazında borç dağılımı (Donut chart)
    - Kredi türü dağılımı
    - Ödeme ilerleme trendi
  - **Banka Analizi**:
    - Banka bazında detaylı özet
    - Toplam geri ödeme tutarı
    - Ödenen tutar
    - Aylık ödeme
    - Ortalama faiz oranı
    - Progress bar gösterimi
  - **Karşılaştırma**:
    - En yüksek/düşük faiz karşılaştırması
    - Banka faiz oranları grafiği
  - **Özet**:
    - Yıl bazlı ödeme istatistikleri
    - Ödenen taksit sayısı
    - Toplam ödenen tutar
    - Kalan taksit sayısı
    - Aylık ödeme dağılımı grafiği
    - Tahmini bitiş tarihi

- ✅ **PDF Rapor Çıktısı**:
  - Tüm kredi detayları
  - Grafik ve istatistikler
  - Banka bazlı analiz

### 5. Risk Analizi
- ✅ Kredi risk skoru hesaplama
- ✅ Faiz oranı analizi
- ✅ Borç/gelir oranı değerlendirmesi
- ✅ Ödeme düzenliliği takibi
- ✅ Refinansman önerileri
- ✅ Yapay zeka destekli risk önerileri

### 6. Bildirim Sistemi
- ✅ Ödeme hatırlatmaları
- ✅ Email bildirimleri
- ✅ Sistem bildirimleri
- ✅ Gecikme uyarıları
- ✅ Kredi bitiş tarihi bildirimleri
- ✅ Cron job ile otomatik bildirim gönderimi

### 7. Premium Özellikler
- ✅ Abonelik sistemi (Free, Premium)
- ✅ Ödeme entegrasyonu (Iyzipay)
- ✅ Sınırsız kredi ekleme
- ✅ Gelişmiş raporlar
- ✅ Refinansman analizi
- ✅ Finansal sağlık analizi
- ✅ PDF rapor indirme

### 8. Kullanıcı Yönetimi
- ✅ Email/şifre ile kayıt
- ✅ Email doğrulama
- ✅ Şifre sıfırlama
- ✅ Profil düzenleme
- ✅ Avatar yükleme
- ✅ Oturum yönetimi
- ✅ Güvenlik ayarları

### 9. Admin Panel
- ✅ Kullanıcı yönetimi
- ✅ Abonelik yönetimi
- ✅ İşlem geçmişi
- ✅ Fatura yönetimi
- ✅ Blog yönetimi
- ✅ Kategori yönetimi
- ✅ Dashboard istatistikleri

### 10. Blog & İçerik
- ✅ Blog yazı yönetimi
- ✅ Kategori sistemi
- ✅ SEO optimizasyonu
- ✅ Markdown desteği
- ✅ Görsel yükleme

### 11. Diğer Özellikler
- ✅ Dark/Light tema desteği
- ✅ Responsive tasarım
- ✅ PWA desteği
- ✅ Çoklu dil altyapısı (hazır)
- ✅ Şifre yöneticisi (Sifrelerim)
- ✅ Hesap makinesi araçları
- ✅ SSS sayfası
- ✅ İletişim formu
- ✅ Newsletter aboneliği

---

## 📁 Proje Yapısı

```
kreditakip.com.tr/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth grubu
│   │   ├── giris/               # Login sayfası
│   │   ├── kayit-ol/            # Register sayfası
│   │   └── sifremi-unuttum/     # Forgot password
│   ├── admin/                    # Admin panel
│   │   ├── kullanicilar/        # User management
│   │   ├── faturalar/           # Invoice management
│   │   └── blog/                # Blog management
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin APIs
│   │   ├── payment/             # Payment APIs
│   │   ├── subscription/        # Subscription APIs
│   │   ├── user/                # User APIs
│   │   ├── notifications/       # Notification APIs
│   │   ├── analyze-pdf/         # OCR API
│   │   ├── risk-analysis/       # Risk analysis API
│   │   ├── refinancing-analysis/# Refinancing API
│   │   └── webhook/             # Payment webhooks
│   ├── auth/                     # Auth callbacks
│   ├── blog/                     # Public blog
│   ├── uygulama/                 # Main application
│   │   ├── ana-sayfa/           # Dashboard
│   │   ├── krediler/            # Credits management
│   │   │   ├── kredi-ekle/      # Add credit
│   │   │   └── pdf-odeme-plani/ # PDF payment plan
│   │   ├── kredi-detay/[id]/    # Credit details
│   │   ├── kredi-duzenle/[id]/  # Edit credit
│   │   ├── odeme-plani/         # Payment plan
│   │   ├── odeme-detay/[id]/    # Payment details
│   │   ├── raporlar/            # Reports
│   │   ├── risk-analizi/        # Risk analysis
│   │   ├── refinansman/         # Refinancing
│   │   ├── bildirimler/         # Notifications
│   │   ├── ayarlar/             # Settings
│   │   ├── profil/              # Profile
│   │   ├── sifrelerim/          # Password manager
│   │   ├── premium/             # Premium upgrade
│   │   └── faturalandirma/      # Billing
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # Radix UI components
│   ├── layout/                  # Layout components
│   ├── charts/                  # Chart components
│   └── seo/                     # SEO components
├── lib/                          # Utilities
│   ├── api/                     # API functions
│   │   ├── credits.ts           # Credit operations
│   │   ├── payments.ts          # Payment operations
│   │   ├── subscription.ts      # Subscription operations
│   │   └── user.ts              # User operations
│   ├── email/                   # Email templates
│   ├── utils/                   # Helper functions
│   │   ├── pdf.ts               # PDF generation
│   │   ├── payment-plan-pdf.ts  # Payment plan PDF
│   │   └── early-payment-pdf.ts # Early payment PDF
│   ├── supabase/                # Supabase client
│   ├── types.ts                 # TypeScript types
│   ├── format.ts                # Formatting utilities
│   └── constants.ts             # Constants
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-subscription.ts      # Subscription hook
│   └── use-toast.ts             # Toast notifications
├── public/                       # Static assets
│   ├── images/                  # Images
│   └── icons/                   # Icons
├── styles/                       # Additional styles
├── .env.local                    # Environment variables
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

## 🗄 Veritabanı Modeli

### Tablolar

#### 1. `profiles`
Kullanıcı profil bilgileri
- `id` (UUID, PK): Kullanıcı ID (Supabase Auth ile eşleşir)
- `first_name` (String): Ad
- `last_name` (String): Soyad
- `email` (String): Email
- `phone` (String): Telefon
- `avatar_url` (String): Avatar URL
- `created_at`, `updated_at` (Timestamp)

#### 2. `banks`
Banka bilgileri
- `id` (UUID, PK): Banka ID
- `name` (String): Banka adı
- `logo_url` (String): Logo URL
- `contact_phone`, `contact_email`, `website` (String)
- `category` (String): Kategori
- `is_active` (Boolean): Aktif/pasif
- `created_at`, `updated_at` (Timestamp)

#### 3. `credit_types`
Kredi türleri
- `id` (UUID, PK): Tür ID
- `name` (String): Tür adı
- `description` (String): Açıklama
- `created_at` (Timestamp)

#### 4. `credits`
Krediler (Ana tablo)
- `id` (UUID, PK): Kredi ID
- `user_id` (UUID, FK → profiles): Kullanıcı
- `bank_id` (UUID, FK → banks): Banka
- `credit_type_id` (UUID, FK → credit_types): Kredi türü
- `credit_code` (String): Kredi kodu
- `account_number` (String): Hesap numarası
- `initial_amount` (Number): Başlangıç tutarı
- `remaining_debt` (Number): Kalan borç
- `monthly_payment` (Number): Aylık ödeme
- `interest_rate` (Number): Faiz oranı
- `start_date`, `end_date` (Date)
- `last_payment_date` (Date)
- `status` (Enum): active | closed | overdue
- `payment_progress` (Number): Ödeme ilerleme %
- `remaining_installments` (Number): Kalan taksit
- `total_installments` (Number): Toplam taksit
- `overdue_days` (Number): Gecikme gün sayısı
- `total_payback` (Number): Toplam geri ödeme
- `calculated_interest_rate` (Number): Hesaplanan faiz
- `collateral`, `insurance_status`, `branch_name` (String)
- `created_at`, `updated_at` (Timestamp)

#### 5. `payment_plans`
Ödeme planları
- `id` (UUID, PK): Plan ID
- `credit_id` (UUID, FK → credits): Kredi
- `installment_number` (Number): Taksit no
- `due_date` (Date): Vade tarihi
- `principal_payment` (Number): Ana para
- `interest_payment` (Number): Faiz
- `total_payment` (Number): Toplam ödeme
- `remaining_balance` (Number): Kalan bakiye
- `status` (Enum): pending | paid | overdue
- `payment_date` (Date): Ödeme tarihi
- `created_at` (Timestamp)

#### 6. `subscriptions`
Abonelik bilgileri
- `id` (UUID, PK): Abonelik ID
- `user_id` (UUID, FK → profiles): Kullanıcı
- `plan_type` (Enum): free | premium
- `status` (Enum): active | canceled | expired
- `start_date`, `end_date` (Date)
- `payment_method` (String)
- `amount` (Number)
- `created_at`, `updated_at` (Timestamp)

#### 7. `invoices`
Faturalar
- `id` (UUID, PK): Fatura ID
- `user_id` (UUID, FK → profiles): Kullanıcı
- `subscription_id` (UUID, FK → subscriptions)
- `invoice_number` (String): Fatura no
- `amount` (Number): Tutar
- `status` (Enum): paid | pending | canceled
- `payment_date` (Date)
- `created_at` (Timestamp)

#### 8. `notifications`
Bildirimler
- `id` (UUID, PK): Bildirim ID
- `user_id` (UUID, FK → profiles): Kullanıcı
- `type` (String): Bildirim türü
- `title`, `message` (String)
- `is_read` (Boolean): Okundu mu
- `created_at` (Timestamp)

#### 9. `credentials`
Şifre yöneticisi
- `id` (UUID, PK): Kayıt ID
- `user_id` (UUID, FK → profiles): Kullanıcı
- `service_name` (String): Servis adı
- `username` (String): Kullanıcı adı
- `encrypted_password` (String): Şifreli şifre
- `url` (String): URL
- `notes` (String): Notlar
- `created_at`, `updated_at` (Timestamp)

#### 10. `blog_posts`, `blog_categories`
Blog sistemi
- Blog yazıları ve kategoriler

#### 11. `risk_scores`
Risk skorları
- Kredi finansal sağlık analizi verileri

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/logout` - Çıkış yap
- `POST /api/auth/reset-password` - Şifre sıfırla

### Credits
- `GET /api/credits` - Kredileri listele
- `GET /api/credits/:id` - Kredi detayı
- `POST /api/credits` - Kredi ekle
- `PUT /api/credits/:id` - Kredi güncelle
- `DELETE /api/credits/:id` - Kredi sil

### Payments
- `GET /api/payments` - Ödemeleri listele
- `POST /api/payments` - Ödeme planı oluştur
- `PUT /api/payments/:id` - Ödeme güncelle

### OCR & PDF
- `POST /api/analyze-pdf` - PDF analiz et

### Risk Analysis
- `POST /api/risk-analysis` - Finansal sağlık analizi yap
- `GET /api/risk-analysis/:id` - Risk raporu getir

### Refinancing
- `POST /api/refinancing-analysis` - Refinansman analizi

### Subscriptions
- `GET /api/subscription/status` - Abonelik durumu
- `POST /api/subscription/initialize` - Ödeme başlat
- `POST /api/subscription/upgrade` - Premium'a geç
- `POST /api/subscription/cancel` - İptal et
- `GET /api/subscription/invoices` - Faturalar

### Notifications
- `GET /api/notifications` - Bildirimleri getir
- `POST /api/notifications/send-reminders` - Hatırlatma gönder
- `GET /api/notifications/cron` - Cron job

### Admin
- `GET /api/admin/users` - Kullanıcıları listele
- `GET /api/admin/subscriptions` - Abonelikleri listele
- `GET /api/admin/transactions` - İşlemleri listele
- `GET /api/admin/invoices` - Faturaları listele
- `POST /api/admin/invoices/upload` - Fatura yükle
- `GET /api/admin/blog/posts` - Blog yazıları
- `POST /api/admin/blog/posts` - Yazı ekle
- `PUT /api/admin/blog/posts/:id` - Yazı güncelle
- `DELETE /api/admin/blog/posts/:id` - Yazı sil

### Webhooks
- `POST /api/webhook/iyzico` - Iyzipay webhook

---

## 🎨 Kullanıcı Arayüzü

### Tema Sistemi
- Light & Dark mode desteği
- Emerald-Teal gradient ana renk paleti
- Modern glassmorphism efektleri
- Smooth animasyonlar

### Layout
- **Header**: Logo, navigasyon, kullanıcı menüsü, tema toggle
- **Sidebar** (Uygulama içi): Ana navigasyon menüsü
- **Footer**: Sosyal medya, linkler, copyright

### Sayfa Yapısı

#### Landing Page
- Hero section (Animated background)
- Özellikler
- Kullanıcı büyüme grafiği
- Testimonials
- CTA sections
- Footer

#### Dashboard (Ana Sayfa)
- Hero cards (Toplam borç, Aylık ödeme, Faiz, vb.)
- Aylık ödeme trendi grafiği
- Yaklaşan ödemeler listesi
- Kredi türü dağılımı
- Aktif krediler tablosu

#### Kredilerim
- Hero section
- Tab sistemi (Tümü, Aktif, Gecikmiş, Kapalı)
- Arama ve filtreleme
- Grid/List view toggle
- Kredi kartları
- Pagination

#### Raporlar
- 4 Tab sistemi:
  1. Genel Bakış - Widget kartlar ve grafikler
  2. Banka - Banka bazlı analiz
  3. Karşılaştırma - Faiz karşılaştırmaları
  4. Özet - Yıl bazlı istatistikler
- PDF indirme butonu
- Filtreleme (Banka, Dönem)
- Modern chart components

#### Ödeme Planı
- Gelecek 12 ay takvimi
- Ödeme geçmişi
- Filtreleme
- Ödeme detay modal

#### Risk Analizi
- Risk skoru göstergesi
- Detaylı analiz kartları
- AI önerileri
- Refinansman önerileri

#### Ayarlar
- Tab sistemi (Profil, Hesap, Güvenlik, Bildirimler, Tema, Veri)
- Form validasyonları
- Avatar upload
- Email değiştirme
- Şifre değiştirme
- Bildirim tercihleri
- Tema seçimi
- Veri dışa aktarma

### Component Library
- **UI Components** (Radix UI based):
  - Button, Input, Select, Checkbox, Switch
  - Card, Badge, Avatar, Progress
  - Dialog, Dropdown, Popover, Tooltip
  - Tabs, Accordion, Collapsible
  - Toast notifications
  - Alert dialogs
  - Context menu
  - Calendar & Date picker

- **Custom Components**:
  - BankLogo - Banka logosu
  - AppSidebar - Ana sidebar
  - Header - Header component
  - Footer - Footer component
  - PaginationModern - Sayfalama
  - PDFReportModal - PDF rapor modal
  - Charts - Grafik bileşenleri

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 20.x veya üstü
- pnpm (önerilen) veya npm
- PostgreSQL (Neon DB)
- Supabase hesabı
- Iyzipay hesabı (opsiyonel)

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

# Database
DATABASE_URL=your_neon_db_url

# Iyzipay
IYZIPAY_API_KEY=your_api_key
IYZIPAY_SECRET_KEY=your_secret_key
IYZIPAY_BASE_URL=https://sandbox-api.iyzipay.com

# Email
MAILERSEND_API_KEY=your_mailersend_key
MAILJET_API_KEY=your_mailjet_key
MAILJET_SECRET_KEY=your_mailjet_secret

# AI
GOOGLE_AI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Veritabanını hazırlayın**
- Supabase dashboard'dan tabloları oluşturun
- Schema'yı içe aktarın

5. **Geliştirme sunucusunu başlatın**
```bash
pnpm dev
```

6. **Tarayıcıda açın**
```
http://localhost:3000
```

---

## 🔧 Geliştirme

### Scripts
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint check
```

### Kod Stili
- TypeScript strict mode
- ESLint + Prettier
- Functional components
- Custom hooks kullanımı
- Server/Client component ayrımı

### Klasör Organizasyonu
- Feature-based structure
- Shared components in `/components`
- API routes in `/app/api`
- Types in `/lib/types.ts`
- Utilities in `/lib/utils`

### State Management
- React Context (Auth, Subscription)
- Custom hooks
- Server state (Server Components)

### Styling
- Tailwind utility classes
- CSS modules (gerektiğinde)
- Tailwind config ile custom theme

---

## 📊 Performans

- Lighthouse Score: 90+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size optimized
- Image optimization (Next.js Image)
- Dynamic imports
- Code splitting

---

## 🔐 Güvenlik

- Row Level Security (Supabase)
- API route protection
- CSRF protection
- XSS prevention
- SQL injection protection
- Environment variable encryption
- Secure password hashing (Supabase Auth)

---

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly UI
- Adaptive layouts
- PWA ready

---

## 🧪 Testing

- E2E testing: Playwright (planlanıyor)
- Unit testing: Jest (planlanıyor)
- Integration testing (planlanıyor)

---

## 📈 Analytics & Monitoring

- Vercel Analytics
- Vercel Speed Insights
- Error tracking (planlanıyor)
- User behavior analytics

---

## 🚢 Deployment

### Vercel (Önerilen)
1. GitHub repository bağlayın
2. Environment variables ekleyin
3. Deploy edin

### Diğer Platformlar
- Docker support (hazırlanıyor)
- Self-hosting guide (hazırlanıyor)

---

## 🎯 Gelecek Özellikler

- [ ] Mobil uygulama (React Native)
- [ ] Excel rapor çıktısı
- [ ] Çoklu dil desteği
- [ ] Otomatik ödeme entegrasyonu
- [ ] Banka API entegrasyonları
- [ ] SMS bildirimleri
- [ ] WhatsApp bildirimleri
- [ ] Gelişmiş AI önerileri
- [ ] Kredi karşılaştırma motoru
- [ ] Finansal danışman chat bot

---

## 📞 Destek

- Email: info@kreditakip.com.tr
- Website: https://kreditakip.com.tr
- Dokümantasyon: /docs

---

## 📄 Lisans

Proprietary - Tüm hakları saklıdır.

---

## 👥 Katkıda Bulunanlar

- **Geliştirici**: [Your Name]
- **Tasarım**: [Designer Name]

---

**Son Güncelleme**: 2025-01-14
**Versiyon**: 0.1.0
