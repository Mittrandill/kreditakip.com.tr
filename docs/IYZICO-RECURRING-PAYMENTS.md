# İyzico Tekrarlayan Ödeme Sistemi - Kurulum ve Kullanım Kılavuzu

Bu doküman, İyzico'nun abonelik ve tekrarlayan ödeme sistemi entegrasyonunu açıklar.

## 📋 İçindekiler

1. [Sistem Mimarisi](#sistem-mimarisi)
2. [Kurulum Adımları](#kurulum-adımları)
3. [API Endpoints](#api-endpoints)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [Webhook Yapılandırması](#webhook-yapılandırması)
6. [Frontend Entegrasyonu](#frontend-entegrasyonu)
7. [Test Senaryoları](#test-senaryoları)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Sistem Mimarisi

### Akış Diyagramı

```
1. Kullanıcı Premium'a geçmek ister
   ↓
2. Frontend: /api/subscription/recurring/initialize
   ↓
3. İyzico Checkout Form oluşturulur
   ↓
4. Kullanıcı İyzico'nun güvenli sayfasında kart bilgilerini girer
   ↓
5. İyzico kartı kaydeder ve ilk ödemeyi alır
   ↓
6. Callback: /api/subscription/recurring/callback
   ↓
7. Subscription veritabanına kaydedilir
   ↓
8. Her ay/yıl otomatik ödeme:
   İyzico → Webhook: /api/subscription/webhook
   ↓
9. Subscription süresi uzatılır
```

### Bileşenler

- **Initialize Endpoint**: Abonelik checkout'u başlatır (PCI-DSS uyumlu)
- **Callback Handler**: Kullanıcı ödemeyi tamamlayınca veritabanını günceller
- **Webhook Handler**: İyzico'dan gelen otomatik ödeme bildirimlerini işler
- **Database Schema**: Subscription durumlarını ve webhook loglarını saklar

---

## ⚙️ Kurulum Adımları

### 1. Environment Variables

`.env.local` dosyanıza aşağıdaki değişkenleri ekleyin:

```bash
# İyzico API Credentials
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # Production: https://api.iyzipay.com

# İyzico Subscription Codes (İyzico panelinden alınmalı)
IYZICO_PRODUCT_REFERENCE_CODE=your_product_reference_code
IYZICO_PLAN_REFERENCE_CODE=your_pricing_plan_reference_code

# Webhook Security (opsiyonel ama önerilir)
IYZICO_WEBHOOK_SECRET=your_random_secure_string

# Site URL (callback için)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Production: https://yourdomain.com
```

### 2. İyzico Panelinde Yapılandırma

#### a. Ürün Oluşturma (Product)

1. İyzico paneline giriş yapın
2. **Subscription → Products** bölümüne gidin
3. **Create Product** butonuna tıklayın
4. Ürün bilgilerini girin:
   - Product Name: "Premium Membership" veya "Premium Üyelik"
   - Description: Açıklama
5. **Product Reference Code**'u kopyalayın ve `IYZICO_PRODUCT_REFERENCE_CODE` olarak kaydedin

#### b. Ödeme Planı Oluşturma (Pricing Plan)

1. Oluşturduğunuz ürüne tıklayın
2. **Create Pricing Plan** butonuna tıklayın
3. Plan bilgilerini girin:
   - Plan Name: "Aylık Plan" veya "Monthly Plan"
   - Price: 199.00 TRY (aylık) veya 1990.00 TRY (yıllık)
   - Billing Frequency: MONTHLY veya YEARLY
   - Payment Interval: 1
   - Payment Interval Type: MONTH veya YEAR
4. **Pricing Plan Reference Code**'u kopyalayın ve `IYZICO_PLAN_REFERENCE_CODE` olarak kaydedin

#### c. Webhook URL'leri Ayarlama

1. İyzico panelinde **Settings → Webhooks** bölümüne gidin
2. Aşağıdaki URL'leri ekleyin:
   ```
   https://yourdomain.com/api/subscription/webhook
   ```
3. Aşağıdaki event'leri seçin:
   - ✅ subscription.renewed
   - ✅ subscription.payment.success
   - ✅ subscription.payment.failed
   - ✅ subscription.cancelled
   - ✅ subscription.expired

### 3. Veritabanı Kurulumu

Veritabanı migration'ını çalıştırın:

```bash
# Supabase SQL Editor'de çalıştırın
psql -U postgres -d your_database < database-scripts/62-create-recurring-subscription-tables.sql
```

Veya Supabase Dashboard → SQL Editor'de `62-create-recurring-subscription-tables.sql` dosyasının içeriğini çalıştırın.

---

## 🔌 API Endpoints

### 1. Initialize Subscription

**Endpoint**: `POST /api/subscription/recurring/initialize`

**Kullanım**: Abonelik checkout formunu başlatır

**Request Body**:
```json
{
  "userId": "uuid",
  "planId": "premium-monthly" | "premium-yearly",
  "billingInfo": {
    "fullName": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone": "05551234567",
    "identityNumber": "12345678901",
    "address": "Adres satırı",
    "city": "Istanbul",
    "district": "Kadıköy",
    "zipCode": "34710",
    "taxNumber": "1234567890",  // Opsiyonel
    "taxOffice": "Kadıköy"      // Opsiyonel
  }
}
```

**Response**:
```json
{
  "success": true,
  "token": "checkout_token",
  "checkoutFormContent": "HTML content",
  "paymentPageUrl": "https://sandbox-api.iyzipay.com/payment/..."
}
```

**Frontend Kullanımı**:
```typescript
const response = await fetch('/api/subscription/recurring/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, planId, billingInfo })
})

const { checkoutFormContent } = await response.json()

// İyzico Checkout Form'u göster
document.getElementById('iyzipay-checkout-form').innerHTML = checkoutFormContent
```

### 2. Callback Handler

**Endpoint**: `GET/POST /api/subscription/recurring/callback`

**Kullanım**: İyzico checkout tamamlandıktan sonra otomatik çağrılır

**Query Params** (GET):
```
?token=checkout_token
```

**Not**: Bu endpoint kullanıcıyı otomatik olarak yönlendirir:
- Başarılı: `/uygulama/ayarlar?payment=success&subscription=active`
- Başarısız: `/uygulama/ayarlar?payment=failed&error=...`

### 3. Webhook Handler

**Endpoint**: `POST /api/subscription/webhook`

**Kullanım**: İyzico'dan gelen otomatik ödeme bildirimlerini işler

**Request Body** (İyzico tarafından gönderilir):
```json
{
  "eventType": "subscription.renewed",
  "subscriptionReferenceCode": "sub_ref_code",
  "paymentId": "payment_id",
  "status": "SUCCESS",
  "amount": "199.00",
  "currency": "TRY",
  "paidDate": "2025-10-31T12:00:00Z"
}
```

**Event Types**:
- `subscription.renewed`: Abonelik başarıyla yenilendi
- `subscription.payment.success`: Ödeme başarılı
- `subscription.payment.failed`: Ödeme başarısız
- `subscription.cancelled`: Abonelik iptal edildi
- `subscription.expired`: Abonelik süresi doldu

### 4. Cancel Subscription

**Endpoint**: Mevcut `/api/subscription/cancel` kullanılabilir

**Kullanım**: Kullanıcı aboneliğini iptal eder

```typescript
import { cancelSubscription } from '@/app/actions/subscription'

const result = await cancelSubscription()
if (result.success) {
  console.log('Abonelik iptal edildi')
}
```

---

## 💾 Veritabanı Şeması

### pending_subscriptions

Checkout tamamlanmadan önce geçici kayıtlar:

```sql
CREATE TABLE public.pending_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan_id TEXT,
  token TEXT UNIQUE,
  conversation_id TEXT,
  status TEXT, -- 'pending', 'completed', 'failed'
  subscription_reference TEXT,
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### webhook_logs

İyzico webhook bildirimleri:

```sql
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY,
  event_type TEXT,
  subscription_reference TEXT,
  payload JSONB,
  status TEXT, -- 'received', 'processed', 'failed'
  created_at TIMESTAMP
);
```

### subscriptions (güncellenmiş)

Yeni kolonlar:
- `iyzico_subscription_reference`: İyzico'nun subscription reference code'u
- `start_date`: Abonelik başlangıç tarihi
- `end_date`: Abonelik bitiş tarihi (iptal/expired için)
- `plan_id`: premium-monthly veya premium-yearly

---

## 🔔 Webhook Yapılandırması

### Webhook Security

Webhook endpoint'inizi korumak için:

1. `.env.local` dosyasına random bir secret ekleyin:
```bash
IYZICO_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. İyzico panelinde webhook ayarlarına bu secret'ı ekleyin

3. Webhook handler otomatik olarak `Authorization` header'ını kontrol eder:
```typescript
const authHeader = request.headers.get('authorization')
const expectedAuth = `Bearer ${process.env.IYZICO_WEBHOOK_SECRET}`
```

### Webhook Test Etme

Test için curl kullanabilirsiniz:

```bash
curl -X POST https://yourdomain.com/api/subscription/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_webhook_secret" \
  -d '{
    "eventType": "subscription.renewed",
    "subscriptionReferenceCode": "test_sub_ref",
    "paymentId": "test_payment_id",
    "status": "SUCCESS",
    "amount": "199.00",
    "currency": "TRY"
  }'
```

---

## 🎨 Frontend Entegrasyonu

### Örnek Kullanım (React)

```tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (planId: string) => {
    setLoading(true)

    try {
      // 1. Billing info topla (form'dan)
      const billingInfo = {
        fullName: 'Ahmet Yılmaz',
        email: user.email,
        phone: '05551234567',
        identityNumber: '12345678901',
        address: 'Adres',
        city: 'Istanbul',
        district: 'Kadıköy',
        zipCode: '34710'
      }

      // 2. Subscription initialize
      const response = await fetch('/api/subscription/recurring/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId,
          billingInfo
        })
      })

      const data = await response.json()

      if (data.success) {
        // 3. İyzico Checkout Form'u göster
        const checkoutDiv = document.getElementById('iyzipay-checkout-form')
        if (checkoutDiv) {
          checkoutDiv.innerHTML = data.checkoutFormContent
        }
      } else {
        alert('Hata: ' + data.error)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={() => handleSubscribe('premium-monthly')}>
        Aylık Premium
      </button>
      <button onClick={() => handleSubscribe('premium-yearly')}>
        Yıllık Premium
      </button>

      {/* İyzico Checkout Form buraya render edilecek */}
      <div id="iyzipay-checkout-form"></div>
    </div>
  )
}
```

### Callback Sonrası Bildirim

Kullanıcı ödemeyi tamamlayınca callback otomatik olarak ayarlar sayfasına yönlendirir:

```tsx
// app/uygulama/ayarlar/page.tsx içinde
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const payment = params.get('payment')
  const subscription = params.get('subscription')

  if (payment === 'success' && subscription === 'active') {
    toast({
      title: 'Başarılı!',
      description: 'Premium üyeliğiniz aktif edildi.'
    })
  } else if (payment === 'failed') {
    const error = params.get('error')
    toast({
      title: 'Hata',
      description: error || 'Ödeme başarısız oldu.',
      variant: 'destructive'
    })
  }
}, [])
```

---

## 🧪 Test Senaryoları

### Test Kartları (Sandbox)

İyzico sandbox'ta test için kullanılabilecek kartlar:

| Kart Numarası | Expiry | CVC | Sonuç |
|--------------|--------|-----|-------|
| 5528 7900 0000 0001 | 12/30 | 123 | Başarılı |
| 5406 6700 0000 0009 | 12/30 | 123 | Başarısız |

### Test Adımları

1. **Abonelik Başlatma**:
   ```
   - Premium'a geç butonuna tıklayın
   - Billing bilgilerini doldurun
   - İyzico checkout form'u açılmalı
   ```

2. **Ödeme Yapma**:
   ```
   - Test kartı bilgilerini girin
   - 3D Secure simülasyonunu tamamlayın
   - Callback sayfasına yönlendirilmeli
   ```

3. **Subscription Kontrolü**:
   ```sql
   -- Supabase SQL Editor'de
   SELECT * FROM subscriptions WHERE user_id = 'user_uuid';
   SELECT * FROM payment_transactions WHERE user_id = 'user_uuid';
   SELECT * FROM pending_subscriptions WHERE user_id = 'user_uuid';
   ```

4. **Webhook Testi**:
   ```bash
   # Webhook endpoint'ine manuel request gönderin
   curl -X POST http://localhost:3000/api/subscription/webhook \
     -H "Content-Type: application/json" \
     -d '{"eventType":"subscription.renewed",...}'
   ```

---

## 🔧 Troubleshooting

### Sık Karşılaşılan Hatalar

#### 1. "Product Reference Code not found"

**Sebep**: İyzico panelinde ürün/plan oluşturulmamış veya yanlış kod kullanılmış

**Çözüm**:
- İyzico panelinde Product ve Pricing Plan oluşturun
- `.env.local` dosyasındaki kodları kontrol edin
- Sandbox/Production environment'ını kontrol edin

#### 2. "Callback URL not reachable"

**Sebep**: İyzico callback URL'e ulaşamıyor (localhost'ta çalışmaz)

**Çözüm**:
- Production/staging ortamında test edin
- Veya ngrok kullanın:
  ```bash
  ngrok http 3000
  # Ngrok URL'ini NEXT_PUBLIC_SITE_URL olarak ayarlayın
  ```

#### 3. "Subscription not found in database"

**Sebep**: Pending subscription kaydı oluşturulmamış

**Çözüm**:
- Initialize endpoint'inin pending_subscriptions tablosuna yazıp yazmadığını kontrol edin
- Veritabanı migration'ının çalıştırıldığından emin olun

#### 4. "Webhook not firing"

**Sebep**: İyzico webhook URL'ini bulamıyor veya secret yanlış

**Çözüm**:
- İyzico panelinde webhook URL'inin doğru olduğunu kontrol edin
- HTTPS kullanılıyor olmalı (production'da)
- Webhook secret'ın doğru olduğunu kontrol edin
- İyzico panelinde webhook loglarını kontrol edin

### Debug İpuçları

1. **Console Logları**:
   ```bash
   # Server loglarını izleyin
   npm run dev
   # Webhook logları için
   tail -f logs/webhooks.log
   ```

2. **Database Logları**:
   ```sql
   -- Webhook loglarını kontrol edin
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

   -- Pending subscriptions'ları kontrol edin
   SELECT * FROM pending_subscriptions WHERE status = 'pending';
   ```

3. **İyzico Panel Logları**:
   - İyzico panelinde **Logs → API Logs** bölümünden request/response loglarını kontrol edin
   - Webhook Logs bölümünden webhook gönderim durumunu kontrol edin

---

## 📞 Destek

### İyzico Destek

- Sandbox: sandbox@iyzico.com
- Production: support@iyzico.com
- Dokümantasyon: https://dev.iyzipay.com/

### Ek Kaynaklar

- İyzico Subscription API Docs: https://dev.iyzipay.com/tr/subscription
- İyzico Webhook Docs: https://dev.iyzipay.com/tr/webhook
- Supabase Docs: https://supabase.com/docs

---

## ✅ Kurulum Checklist

- [ ] İyzico panelinde Product oluşturuldu
- [ ] İyzico panelinde Pricing Plan oluşturuldu
- [ ] `.env.local` dosyasına environment variables eklendi
- [ ] Veritabanı migration'ı çalıştırıldı
- [ ] Webhook URL'i İyzico paneline eklendi
- [ ] Webhook secret yapılandırıldı
- [ ] Test kartı ile ödeme yapıldı ve başarılı oldu
- [ ] Webhook'lar test edildi ve çalışıyor
- [ ] Production environment'ta test edildi

---

**Son Güncelleme**: 31 Ekim 2025
**Versiyon**: 1.0.0
