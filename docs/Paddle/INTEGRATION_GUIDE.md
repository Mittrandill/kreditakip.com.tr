# Paddle Abonelik Sistemi Entegrasyon Kılavuzu

Bu kılavuz, Kreditakip.com.tr projesine tam entegre Paddle abonelik sisteminin nasıl kurulacağını ve kullanılacağını açıklamaktadır.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Özellikler](#özellikler)
3. [Kurulum](#kurulum)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [API Endpoints](#api-endpoints)
6. [Webhook Handler](#webhook-handler)
7. [Frontend Bileşenleri](#frontend-bileşenleri)
8. [Email Bildirimleri](#email-bildirimleri)
9. [Test](#test)

## Genel Bakış

Paddle abonelik sistemi şu özellikleri sağlar:

- ✅ Otomatik abonelik yönetimi
- ✅ Ödeme başarısız olduğunda ek süre (grace period)
- ✅ Plan değiştirme (yükseltme/düşürme)
- ✅ Abonelik duraklatma/devam ettirme
- ✅ İptal yönetimi
- ✅ Kart saklama ve otomatik yenileme
- ✅ Fatura oluşturma
- ✅ Email bildirimleri
- ✅ Kullanım limitleri takibi

## Özellikler

### Abonelik Planları

1. **Free (Ücretsiz)**
   - 1 OCR kredi analizi
   - Risk analizi yok
   - Temel özellikler

2. **Pro (Aylık/Yıllık)**
   - 10 OCR kredi analizi/ay
   - 5 AI finansal sağlık analizi/ay
   - Gelişmiş raporlar
   - Reklamsız deneyim

3. **Premium (Aylık/Yıllık)**
   - Sınırsız OCR kredi analizi
   - Sınırsız AI finansal sağlık analizi
   - Tüm premium özellikler

## Kurulum

### 1. Veritabanı Migrasyonu

```bash
# Migrasyonu çalıştırın
supabase db push
```

### 2. Environment Variables

`.env.local` dosyasına aşağıdaki değişkenleri ekleyin:

```env
# Paddle Configuration
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id
PADDLE_API_KEY=your_api_key
PADDLE_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # veya 'production'
```

### 3. Test Etme

```bash
# Test scriptini çalıştırın
node scripts/test-paddle-integration.js
```

## Veritabanı Şeması

### Ana Tablolar

#### subscriptions
Kullanıcı abonelik bilgilerini tutar:

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- plan_id: TEXT (Plan ID)
- status: TEXT (active, canceled, expired, etc.)
- paddle_subscription_id: TEXT (Paddle abonelik ID)
- paddle_customer_id: TEXT (Paddle müşteri ID)
- start_date: TIMESTAMP
- expires_at: TIMESTAMP
- grace_period_started_at: TIMESTAMP
- grace_period_ends_at: TIMESTAMP
- requires_payment_action: BOOLEAN
```

#### subscription_plans
Mevcut abonelik planlarını tutar:

```sql
- id: TEXT (Primary Key: 'free', 'pro-monthly', etc.)
- name: TEXT
- price: NUMERIC
- currency: TEXT
- billing_period: TEXT (monthly, yearly)
- paddle_product_id: TEXT
- paddle_price_id: TEXT
```

#### subscription_usage
Kullanım limitlerini takip eder:

```sql
- user_id: UUID
- feature_type: TEXT (ocr_analysis, risk_analysis)
- usage_count: INTEGER
- limit_count: INTEGER
- reset_at: TIMESTAMP
```

#### paddle_webhook_events
Paddle webhook olaylarını kaydeder:

```sql
- event_id: TEXT (Unique)
- event_type: TEXT
- event_data: JSONB
- processed: BOOLEAN
```

## API Endpoints

### Abonelik Yönetimi

#### `POST /api/subscription/create-checkout`
Yeni abonelik için checkout oluşturur.

```json
{
  "planId": "premium-monthly",
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe"
}
```

#### `GET /api/subscription/manage`
Abonelik yönetim URL'lerini döndürür.

Query Parameters:
- `userId`: Kullanıcı ID

#### `POST /api/subscription/manage`
Abonelik işlemleri (iptal, duraklatma, devam ettirme).

```json
{
  "userId": "user-uuid",
  "action": "cancel",  // veya 'pause', 'resume', 'change_plan'
  "subscriptionId": "paddle-sub-id",
  "options": {
    "effectiveFrom": "next_billing_period"
  }
}
```

### Kullanım Takibi

#### `GET /api/subscription/usage`
Mevcut kullanım bilgisini döndürür.

Query Parameters:
- `userId`: Kullanıcı ID
- `featureType`: 'ocr_analysis' veya 'risk_analysis' (opsiyonel)

#### `POST /api/subscription/usage`
Kullanımı artırır.

```json
{
  "userId": "user-uuid",
  "featureType": "ocr_analysis",
  "amount": 1,
  "saveCredit": false
}
```

## Webhook Handler

### `POST /api/paddle/webhooks`

Paddle'den gelen webhook olaylarını işler.

#### Desteklenen Olaylar:

- `subscription.created`: Yeni abonelik oluşturuldu
- `subscription.activated`: Abonelik aktifleştirildi
- `subscription.updated`: Abonelik güncellendi
- `subscription.canceled`: Abonelik iptal edildi
- `subscription.payment_succeeded`: Ödeme başarılı
- `subscription.payment_failed`: Ödeme başarısız
- `payment.succeeded`: Tek seferlik ödeme başarılı

## Frontend Bileşenleri

### useSubscriptionV2 Hook

Abonelik yönetimi için özel hook:

```typescript
const {
  subscription,
  loading,
  isPremium,
  isActive,
  isInGracePeriod,
  requiresPayment,
  daysUntilExpiration,
  refresh,
  trackUsage,
  createCheckout,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} = useSubscriptionV2()
```

### PaddleCheckout Component

Abonelik checkout bileşeni:

```tsx
<PaddleCheckout
  planId="premium-monthly"
  planName="Premium"
  planPrice={399}
  planPeriod="monthly"
  features={[
    "Sınırsız OCR analizi",
    "Sınırsız risk analizi",
    "Premium özellikler"
  ]}
  popular={true}
/>
```

## Email Bildirimleri

### Email Şablonları

- `subscription.created`: Hoş geldin emailsı
- `payment.succeeded`: Ödeme başarılı
- `payment.failed`: Ödeme başarısız (ek süreh dahil)
- `subscription.canceled`: İptal onayı
- `subscription.suspended`: Askıya alma
- `subscription.renewed`: Yenileme

### Email Gönderme

```typescript
import { sendSubscriptionEmail } from "@/lib/email/subscription-templates"

await sendSubscriptionEmail({
  to: "user@example.com",
  template: "payment.succeeded",
  data: {
    customerName: "John",
    planName: "Premium",
    amount: "399.00",
    currency: "TRY"
  }
})
```

## Test

### Test Script

```bash
node scripts/test-paddle-integration.js
```

Bu script şunları test eder:
- Veritabanı şeması
- Abonelik planları
- Environment variables
- API endpoints
- RLS policies

### Manuel Test Adımları

1. **Yeni Abonelik Oluşturma**
   - Premium plana geç
   - Payment'ı tamamla
   - Webhook loglarını kontrol et

2. **Ödeme Başarısız Senaryosu**
   - Test kartı kullan
   - Grace period başlaması
   - Email bildirim kontrolü

3. **Plan Değiştirme**
   - Pro'dan Premium'a geç
   - Yıllıktan aylığa geç

4. **İptal Etme**
   - Aboneliği iptal et
   - Bitiş tarihine kadar erşim kontrolü

## Best Practices

### Güvenlik

1. Webhook imzası doğrulaması (production'da aktif edin)
2. RLS policies her zaman etkin
3. Sadece gerekli verileri exposed edin

### Performans

1. Usage tracking için Redis cache kullanılabilir
2. Email queue implementasyonu
3. Webhook events'i arka plana atmak

### Monitoring

1. Paddle dashboard monitoring
2. Webhook error logları
3. Failed payment alertleri
4. Usage limit uyarıları

## Troubleshooting

### Yaygın Sorunlar

1. **Webhook işlenmiyor**
   - Signature verification'ı kontrol et
   - Webhook URL'nin doğru olduğundan emin ol

2. **Abonelik oluşturulamıyor**
   - Paddle API keys kontrol et
   - Product/Price ID'leri doğrula

3. **Email gitmiyor**
   - Email provider ayarları
   - Template syntax'ı kontrol et

### Debug Mode

Development'ta webhook signature verification'ı geçici olarak devre dışı bırakabilirsiniz:

```typescript
// app/api/paddle/webhooks/route.ts
/*
if (!PaddleClient.verifyWebhookSignature(body, signature, PADDLE_PUBLIC_KEY)) {
  console.error("[Paddle Webhook] Invalid signature")
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
}
*/
```

## Production'a Geçiş

1. Tüm testleri tamamla
2. Environment variables'ı production'a göre güncelle
3. Webhook signature verification'ı aktif et
4. Monitoring'i kur
5. Email templates'i final kontrol et

---

Bu kılavuz Paddle abonelik sisteminin başarılı bir şekilde entegre edilmesi için tüm gerekli bilgileri içermektedir. Sorularınız için destek@kreditakip.com.tr adresinden ulaşabilirsiniz.