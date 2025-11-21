# PayTR Payment Form - Kullanım Kılavuzu

## 📋 Genel Bakış

Modern, güvenli ve kullanıcı dostu ödeme formu component'i. PayTR Direct API ile entegre çalışır.

## 🎨 Özellikler

### ✅ Güvenlik
- **PCI DSS Uyumlu**: Kart bilgileri ASLA sunucuya gönderilmez
- **3D Secure**: Otomatik 3D Secure desteği
- **HTTPS**: Güvenli iletişim
- **Client-side Validation**: Gerçek zamanlı doğrulama

### ✅ Kullanıcı Deneyimi
- **Auto-format**: Otomatik kart numarası formatlama
- **Kart Türü Tespiti**: Visa, Mastercard, Troy, Amex
- **Luhn Validation**: Gerçek zamanlı kart numarası doğrulama
- **Error Messages**: Anlaşılır hata mesajları
- **Loading States**: Yükleme göstergeleri

### ✅ Tasarım
- **Responsive**: Mobil uyumlu
- **Modern UI**: Shadcn/ui ile tasarlandı
- **PayTR Branding**: Resmi PayTR logosu
- **Dark Mode**: Otomatik tema desteği

### 🔜 Gelecek Özellikler
- Kart bilgilerini güvenli saklama
- Kayıtlı kartlardan seçim
- Taksit seçenekleri
- Multiple currency support

## 📦 Kurulum

### 1. Component'i Import Edin

```tsx
import { PaymentForm } from "@/components/payment/payment-form"
```

### 2. Kullanım

```tsx
<PaymentForm
  planId="premium-yearly"
  planName="Premium Yıllık Plan"
  amount={199.00}
  billingInfo={{
    fullName: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    phone: "+905551234567",
    address: "Atatürk Mah. İstiklal Cad. No:123",
    city: "İstanbul",
    country: "Türkiye",
    zipCode: "34000"
  }}
  onSuccess={() => {
    console.log("Ödeme başlatıldı")
  }}
  onError={(error) => {
    console.error("Hata:", error)
  }}
/>
```

## 🔧 Props

| Prop | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `planId` | string | ✅ | Plan ID (database) |
| `planName` | string | ✅ | Plan adı (görüntüleme) |
| `amount` | number | ✅ | Ödeme tutarı (TL) |
| `billingInfo` | BillingInfo | ✅ | Fatura bilgileri |
| `onSuccess` | () => void | ❌ | Başarı callback |
| `onError` | (error: string) => void | ❌ | Hata callback |

### BillingInfo Interface

```typescript
interface BillingInfo {
  fullName: string      // Ad Soyad
  email: string         // Email adresi
  phone: string         // Telefon (+905551234567)
  address: string       // Adres
  city: string          // Şehir
  country?: string      // Ülke (opsiyonel, varsayılan: Türkiye)
  zipCode?: string      // Posta kodu (opsiyonel)
}
```

## 🎯 Örnekler

### Temel Kullanım

```tsx
"use client"

import { PaymentForm } from "@/components/payment/payment-form"

export default function CheckoutPage() {
  return (
    <div className="container max-w-2xl mx-auto py-10">
      <PaymentForm
        planId="basic-monthly"
        planName="Temel Aylık Plan"
        amount={49.90}
        billingInfo={{
          fullName: "Demo Kullanıcı",
          email: "demo@example.com",
          phone: "+905551234567",
          address: "Demo Adres",
          city: "İstanbul"
        }}
      />
    </div>
  )
}
```

### Callback'lerle Kullanım

```tsx
"use client"

import { useState } from "react"
import { PaymentForm } from "@/components/payment/payment-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSuccess = () => {
    setIsProcessing(true)
    toast.success("Ödeme sayfasına yönlendiriliyorsunuz...")
    // PayTR'ye yönlendirilecek
  }

  const handleError = (error: string) => {
    toast.error(error)
    // Hata loglama, analytics vb.
  }

  return (
    <PaymentForm
      planId="premium-yearly"
      planName="Premium Yıllık"
      amount={199.00}
      billingInfo={userBillingInfo}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
```

### Conditional Rendering

```tsx
"use client"

import { PaymentForm } from "@/components/payment/payment-form"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function CheckoutPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <div>Lütfen giriş yapın</div>
  }

  return (
    <PaymentForm
      planId={selectedPlan.id}
      planName={selectedPlan.name}
      amount={selectedPlan.price}
      billingInfo={{
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city
      }}
    />
  )
}
```

## 🧪 Test

### Test Kartları

PayTR test modunda kullanabileceğiniz kartlar:

**Visa**
```
Kart No: 4355 0843 5508 4358
Ad: PAYTR TEST
Tarih: 12/24
CVV: 000
```

**Mastercard**
```
Kart No: 5406 6754 0667 5403
Ad: PAYTR TEST
Tarih: 12/24
CVV: 000
```

**Troy**
```
Kart No: 9792 0303 9444 0796
Ad: PAYTR TEST
Tarih: 12/24
CVV: 000
```

### Test Sayfası

Demo sayfasını ziyaret edin:
```
http://localhost:3000/demo/payment
```

## 🔐 Güvenlik

### PCI DSS Uyumluluğu

✅ **Kart bilgileri sunucuya GÖNDERİLMEZ**
- Tüm kart bilgileri client-side'da kalır
- Form submit edildiğinde doğrudan PayTR'ye POST edilir
- Sunucumuz sadece token oluşturur

✅ **Client-Side Validation**
- Luhn algoritması ile kart numarası kontrolü
- CVV format kontrolü
- Expiry date validation
- XSS koruması

✅ **HTTPS Zorunlu**
- Production'da HTTPS gereklidir
- Mixed content engellenir

### Best Practices

```tsx
// ✅ DOĞRU - Billing info user'dan al
const billingInfo = {
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  city: user.city
}

// ❌ YANLIŞ - Hard-coded bilgiler
const billingInfo = {
  fullName: "Test User",
  email: "test@test.com",
  // ...
}
```

## 🎨 Styling

### Custom Styling

Component Tailwind CSS kullanır. Özelleştirmek için:

```tsx
<div className="max-w-xl mx-auto">
  <PaymentForm {...props} />
</div>
```

### Theme

Dark mode otomatik desteklenir:
- Shadcn/ui theme provider kullanılır
- Sistem tercihini otomatik takip eder

## 📱 Responsive Design

Form tüm ekran boyutlarında çalışır:
- **Mobile**: Tek sütun, büyük butonlar
- **Tablet**: Optimized layout
- **Desktop**: Maksimum 700px genişlik

## 🐛 Troubleshooting

### Form Submit Olmuyor

1. Browser console'u kontrol edin
2. Network tab'ında `/api/subscription/checkout/direct` isteğine bakın
3. PayTR credentials'ları kontrol edin

### Validation Hataları

```typescript
// Kart numarası: 15-16 hane
// CVV: 3 hane
// Expiry: MM/YY format
// Ay: 01-12
// Yıl: YY format (25 = 2025)
```

### PayTR'ye Yönlendirilmiyor

1. `paytr_token` oluşturuldu mu?
2. Form data tüm alanları içeriyor mu?
3. HTTPS kullanılıyor mu?

## 📊 Analytics

Form interaction'larını track edin:

```tsx
const handleSuccess = () => {
  // Analytics
  gtag('event', 'payment_initiated', {
    plan_id: planId,
    amount: amount,
    currency: 'TRY'
  })
}

const handleError = (error) => {
  // Error tracking
  Sentry.captureException(new Error(error))
}
```

## 🚀 Production Checklist

- [ ] `PAYTR_TEST_MODE=0` olmalı
- [ ] HTTPS aktif olmalı
- [ ] PayTR Panel'de Bildirim URL tanımlı olmalı
- [ ] Error tracking aktif olmalı
- [ ] Rate limiting kontrol edilmeli
- [ ] Gerçek kart ile test yapılmalı

## 📞 Destek

Sorun yaşıyorsanız:
- `/docs/PAYTR_DIRECT_API_INTEGRATION.md` - Teknik dokümantasyon
- `/docs/PAYTR_DIRECT_TESTING_GUIDE.md` - Test rehberi
- PayTR Destek: Mağaza Paneli > Destek

## 📝 Changelog

### v1.0.0 (2025-11-21)
- ✨ İlk versiyon
- ✅ Temel ödeme formu
- ✅ Kart validasyonu
- ✅ Auto-format
- ✅ Kart türü tespiti
- ✅ PayTR logo entegrasyonu
- 🔜 Kart saklama (placeholder)
