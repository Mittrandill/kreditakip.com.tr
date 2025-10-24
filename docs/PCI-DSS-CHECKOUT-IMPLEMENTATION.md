# PCI-DSS Uyumlu Checkout Form İmplementasyonu

## 🎯 Amaç

Bu döküman, Kredi Takip uygulamasında **PCI-DSS uyumlu** ödeme sistemini nasıl kullanacağınızı açıklar.

### ✅ Neler Değişti?

**ÖNCE (Güvensiz):**
- Kart bilgileri frontend'den sunucuya geliyordu
- Kart numarası, CVV, vb. sunucu memory'sinde tutuluyordu
- PCI-DSS ihlali vardı

**ŞIMDI (Güvenli):**
- Kart bilgileri **asla** sunucunuza gelmiyor
- Kullanıcı Iyzico'nun güvenli sayfasında ödeme yapıyor
- PCI-DSS uyumlu ✅

---

## 🔧 Kurulum Adımları

### 1. Database Tablosunu Oluştur

Supabase SQL Editor'de şu scripti çalıştır:

\`\`\`sql
-- scripts/create-pending-payments-table.sql dosyasındaki SQL'i çalıştır
\`\`\`

Bu tablo ödeme başlatma bilgilerini tutar.

### 2. Environment Variables

`.env.local` dosyasına ekle:

\`\`\`bash
# Iyzico (zaten var)
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # Production: https://api.iyzipay.com

# Application URL (callback için gerekli)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://kreditakip.com.tr
\`\`\`

---

## 🚀 Frontend Entegrasyonu

### Adım 1: Ödeme Başlatma

Kullanıcı "Ödeme Yap" butonuna tıkladığında:

\`\`\`typescript
// Örnek: components/payment-button.tsx

async function initiatePayment() {
  setLoading(true)

  try {
    const response = await fetch("/api/payment/checkout/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: "premium-monthly", // veya premium-yearly
        billingInfo: {
          fullName: "Ahmet Yılmaz",
          email: "ahmet@example.com",
          phone: "05551234567",
          identityNumber: "12345678901",
          address: "Örnek Mah. Test Sok. No:1",
          city: "İstanbul",
          district: "Kadıköy",
          zipCode: "34000",
        },
      }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    // Seçenek 1: Inline Checkout Form (Modal içinde göster)
    if (data.checkoutFormContent) {
      // HTML içeriğini modal içinde göster
      showCheckoutModal(data.checkoutFormContent)
    }

    // Seçenek 2: Redirect (Yeni sayfaya yönlendir)
    if (data.paymentPageUrl) {
      window.location.href = data.paymentPageUrl
    }
  } catch (error) {
    console.error("Payment initialization failed:", error)
    alert("Ödeme başlatılamadı")
  } finally {
    setLoading(false)
  }
}
\`\`\`

### Adım 2: Checkout Form'u Gösterme

#### Seçenek A: Modal İçinde (İframe)

\`\`\`tsx
"use client"

import { useState } from "react"

export function CheckoutModal({ checkoutFormContent }: { checkoutFormContent: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: checkoutFormContent }} />
      </div>
    </div>
  )
}
\`\`\`

#### Seçenek B: Yeni Sayfaya Yönlendir (Daha Basit)

\`\`\`tsx
// Kullanıcı otomatik olarak Iyzico'nun sayfasına gider
window.location.href = data.paymentPageUrl
\`\`\`

### Adım 3: Callback Handling

Kullanıcı ödemeyi tamamladıktan sonra otomatik olarak `/api/payment/checkout/callback` endpoint'ine yönlendirilir.

Bu endpoint:
1. Ödeme sonucunu Iyzico'dan alır
2. Subscription oluşturur
3. Kullanıcıyı `/uygulama/ayarlar?payment=success` sayfasına yönlendirir

Ayarlar sayfanızda success/fail mesajını gösterin:

\`\`\`tsx
// app/uygulama/ayarlar/page.tsx

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get("payment")
  const reason = searchParams.get("reason")

  useEffect(() => {
    if (paymentStatus === "success") {
      toast.success("Ödeme başarılı! Premium üyeliğiniz aktif edildi.")
    } else if (paymentStatus === "failed") {
      toast.error(`Ödeme başarısız: ${reason || "Bilinmeyen hata"}`)
    }
  }, [paymentStatus])

  return (
    // ... ayarlar sayfası içeriği
  )
}
\`\`\`

---

## 📋 Ödeme Akışı

\`\`\`
1. Kullanıcı "Premium'a Yükselt" tıklar
   ↓
2. Frontend → POST /api/payment/checkout/initialize
   ↓
3. Backend Iyzico'ya checkout form oluşturma isteği gönderir
   ↓
4. Iyzico checkout form HTML veya URL döner
   ↓
5. Kullanıcı Iyzico'nun güvenli sayfasında kart bilgilerini girer
   ↓
6. Kullanıcı "Ödeme Yap" tıklar
   ↓
7. Iyzico ödemeyi işler
   ↓
8. Iyzico → POST /api/payment/checkout/callback (token ile)
   ↓
9. Backend ödeme sonucunu Iyzico'dan alır
   ↓
10. Backend subscription oluşturur
   ↓
11. Kullanıcı /uygulama/ayarlar?payment=success sayfasına yönlendirilir
\`\`\`

---

## 🔒 Güvenlik Özellikleri

### ✅ PCI-DSS Uyumlu
- Kart bilgileri **asla** sunucunuza gelmiyor
- Iyzico'nun PCI-DSS sertifikalı altyapısı kullanılıyor
- Compliance maliyeti ve riski sıfır

### ✅ Token-Based
- Her ödeme için unique token oluşuruluyor
- Token 1 saat sonra otomatik expire oluyor
- Replay attack koruması var

### ✅ Callback Validation
- Callback endpoint sadece Iyzico'dan gelen istekleri kabul eder
- Token doğrulaması yapılır
- Duplicate payment koruması var

### ✅ Audit Trail
- Her ödeme `pending_payments` tablosunda loglanır
- Subscription creation kaydedilir
- Troubleshooting için tam log trail

---

## 🧪 Test Etme

### Test Kartları (Sandbox)

Iyzico sandbox ortamında test kartları:

\`\`\`
Başarılı Ödeme:
Kart No: 5528790000000008
Tarih: 12/30
CVV: 123
3D Secure: 123456

Başarısız Ödeme:
Kart No: 5406675406675403
Tarih: 12/30
CVV: 123
\`\`\`

### Test Adımları

1. **Ödeme Başlatma Testi:**
\`\`\`bash
curl -X POST http://localhost:3000/api/payment/checkout/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium-monthly",
    "billingInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "05551234567",
      "identityNumber": "12345678901",
      "address": "Test Address",
      "city": "Istanbul",
      "district": "Kadikoy",
      "zipCode": "34000"
    }
  }'
\`\`\`

2. **Checkout Form Gösterme:**
   - Response'daki `checkoutFormContent` veya `paymentPageUrl` kullan

3. **Test Kartı ile Ödeme Yap:**
   - Iyzico sayfasında test kartını gir
   - 3D Secure code: 123456

4. **Callback Kontrolü:**
   - Otomatik olarak `/uygulama/ayarlar?payment=success` sayfasına yönlendirilmeli
   - Database'de subscription oluşturulmalı

---

## 🔧 Troubleshooting

### Ödeme başlatılamıyor

**Hata:** "Payment initialization failed"

**Çözüm:**
1. Iyzico credentials'ları kontrol et
2. IYZICO_BASE_URL doğru mu? (sandbox vs production)
3. Console log'lara bak: `[checkout]` prefix'li loglar

### Callback çalışmıyor

**Hata:** Kullanıcı ödeme yaptı ama subscription oluşmadı

**Çözüm:**
1. `NEXT_PUBLIC_APP_URL` doğru set edilmiş mi?
2. Callback URL'e erişilebiliyor mu? (localhost'ta ngrok gerekebilir)
3. `pending_payments` tablosuna kayıt düştü mü?
4. Console log'lara bak: `[checkout-callback]` prefix'li loglar

### Token bulunamadı hatası

**Hata:** "Pending payment not found"

**Çözüm:**
1. Token expire olmuş olabilir (1 saat)
2. `pending_payments` tablosunu kontrol et
3. User ID eşleşiyor mu?

---

## 📊 Monitoring

### Önemli Metrikler

1. **Checkout Initialization Success Rate:**
\`\`\`sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
FROM pending_payments
WHERE created_at > NOW() - INTERVAL '7 days';
\`\`\`

2. **Average Payment Completion Time:**
\`\`\`sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM pending_payments
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';
\`\`\`

3. **Abandoned Checkouts:**
\`\`\`sql
SELECT COUNT(*)
FROM pending_payments
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
\`\`\`

---

## 🚀 Production Deployment

### Checklist

- [ ] `IYZICO_BASE_URL` production URL'e değiştirildi
- [ ] `NEXT_PUBLIC_APP_URL` production domain'e set edildi
- [ ] `pending_payments` tablosu production database'de oluşturuldu
- [ ] Iyzico production credentials alındı
- [ ] Test kartı ile sandbox'ta baştan sona test edildi
- [ ] Callback URL'e public internet'ten erişilebiliyor
- [ ] SSL sertifikası aktif (HTTPS)
- [ ] Error monitoring (Sentry vb.) kuruldu

### Migration from Old System

Eski direct payment endpoint'lerini kapatmak için:

\`\`\`typescript
// app/api/payment/direct/route.ts
export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use /api/payment/checkout/initialize instead",
      migration: "https://docs.kreditakip.com.tr/pci-dss-migration"
    },
    { status: 410 } // Gone
  )
}
\`\`\`

---

## 📞 Destek

Sorun yaşarsan:
1. Console log'ları kontrol et
2. `SECURITY.md` dosyasını oku
3. Iyzico dokümantasyonuna bak: https://dev.iyzipay.com
4. GitHub issue aç (güvenlik sorunları için email kullan)

---

**Son Güncelleme:** 2025-10-20
**Versiyon:** 1.0.0
**Yazar:** Claude Code + Kredi Takip Team
