# PayTR Direct API Entegrasyonu

## Genel Bakış

Bu proje artık PayTR Direct API kullanmaktadır. Direct API ile kullanıcılar kart bilgilerini kendi formumuzda girerler ve ödeme 3D Secure ile güvenli bir şekilde işlenir.

## Güvenlik Önlemleri

### 1. PCI DSS Uyumluluğu
- ✅ Kart bilgileri **ASLA** sunucumuza gönderilmez
- ✅ Kart bilgileri client-side'dan **DOĞRUDAN** PayTR'ye POST edilir
- ✅ Sunucumuz sadece token ve form metadata oluşturur
- ✅ Kart bilgileri hiçbir şekilde loglanmaz veya kaydedilmez

### 2. Token Güvenliği
- ✅ HMAC SHA256 ile token imzalama
- ✅ Merchant salt ile ek güvenlik katmanı
- ✅ Token her işlem için benzersiz

### 3. Callback Güvenliği
- ✅ Hash doğrulama zorunlu
- ✅ Idempotency kontrolü (duplicate webhook koruması)
- ✅ IP rate limiting

### 4. Input Validation
- ✅ Luhn algoritması ile kart numarası doğrulama
- ✅ CVV format kontrolü
- ✅ Son kullanma tarihi doğrulama
- ✅ Tüm form alanları server-side validate edilir

## Mimari

### Endpoint'ler

#### 1. Token Generation (Server-Side)
```
POST /api/subscription/checkout/direct
```

**İstek:**
```json
{
  "planId": "uuid",
  "billingInfo": {
    "fullName": "Ad Soyad",
    "email": "email@example.com",
    "phone": "+905551234567",
    "address": "Adres",
    "city": "Şehir"
  },
  "installmentCount": 0,
  "cardType": "bonus" // opsiyonel
}
```

**Yanıt:**
```json
{
  "success": true,
  "token": "generated_token",
  "orderId": "SUB123456789",
  "formData": {
    "merchant_id": "123456",
    "user_ip": "1.2.3.4",
    "merchant_oid": "SUB123456789",
    "email": "email@example.com",
    "payment_type": "card",
    "payment_amount": "199.00",
    "installment_count": "0",
    "currency": "TL",
    "test_mode": "0",
    "non_3d": "0",
    "user_name": "Ad Soyad",
    "user_address": "Adres",
    "user_phone": "+905551234567",
    "user_basket": "base64_encoded_basket",
    "paytr_token": "generated_token",
    "client_lang": "tr",
    "debug_on": "0",
    "merchant_ok_url": "https://yoursite.com/api/subscription/checkout/callback?merchant_oid=SUB123456789",
    "merchant_fail_url": "https://yoursite.com/api/subscription/checkout/callback?merchant_oid=SUB123456789&status=failed"
  },
  "paytrUrl": "https://www.paytr.com/odeme"
}
```

#### 2. Payment Submission (Client-Side)

Client-side kart bilgilerini alır ve PayTR'ye POST eder:

```javascript
// Client-side JavaScript
const response = await fetch('/api/subscription/checkout/direct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'plan-uuid',
    billingInfo: { /* ... */ },
    installmentCount: 0
  })
});

const { formData, paytrUrl } = await response.json();

// Kart bilgilerini ekle
formData.cc_owner = cardHolderName;
formData.card_number = cardNumber.replace(/\s/g, '');
formData.expiry_month = expiryMonth;
formData.expiry_year = expiryYear;
formData.cvv = cvv;

// PayTR'ye POST et (form submission veya hidden form ile)
const form = document.createElement('form');
form.method = 'POST';
form.action = paytrUrl;

for (const [key, value] of Object.entries(formData)) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key;
  input.value = value;
  form.appendChild(input);
}

document.body.appendChild(form);
form.submit();
```

#### 3. Callback Handler (Server-Side)
```
POST /api/subscription/checkout/callback
```

Bu endpoint hem GET hem POST request'leri kabul eder:
- **POST**: PayTR'den gelen webhook (ödeme sonucu bildirimi)
- **GET**: Kullanıcı yönlendirmesi (success/fail)

## Kart Validasyon

`PayTRClient` sınıfı şu validasyon methodlarını sağlar:

### 1. Kart Numarası Validasyonu
```typescript
paytrClient.validateCardNumber(cardNumber: string): boolean
```
- Luhn algoritması ile doğrulama
- 13-19 hane arası kontrol
- Sadece rakam kontrolü

### 2. CVV Validasyonu
```typescript
paytrClient.validateCVV(cvv: string): boolean
```
- 3 haneli rakam kontrolü

### 3. Son Kullanma Tarihi Validasyonu
```typescript
paytrClient.validateExpiryDate(month: string, year: string): boolean
```
- Ay: 1-12 arası
- Yıl: YY formatı (2 haneli)
- Geçmiş tarih kontrolü

## Test Kartları

PayTR test modunda kullanılacak kart bilgileri:

### Visa
```
Kart Sahibi: PAYTR TEST
Kart No: 4355 0843 5508 4358
Son Kullanma: 12/24
CVV: 000
```

### Mastercard
```
Kart Sahibi: PAYTR TEST
Kart No: 5406 6754 0667 5403
Son Kullanma: 12/24
CVV: 000
```

### Troy
```
Kart Sahibi: PAYTR TEST
Kart No: 9792 0303 9444 0796
Son Kullanma: 12/24
CVV: 000
```

## Environment Variables

```bash
# PayTR Payment Gateway
PAYTR_MERCHANT_ID=your-paytr-merchant-id
PAYTR_MERCHANT_KEY=your-paytr-merchant-key
PAYTR_MERCHANT_SALT=your-paytr-merchant-salt
PAYTR_TEST_MODE=1  # Test modu: 1, Canlı mod: 0
```

## Callback URL Ayarları

PayTR Mağaza Paneli > Ayarlar > Bildirim URL Ayarları:

```
Bildirim URL: https://yourdomain.com/api/subscription/checkout/callback
Protokol: HTTPS (SSL varsa)
```

**ÖNEMLİ**: SSL sertifikanız varsa mutlaka HTTPS kullanın!

## Hata Kodları

PayTR callback'te dönen hata kodları:

| Kod | Açıklama |
|-----|----------|
| 0 | Değişken (detaylı mesaj failed_reason_msg'de) |
| 1 | Kimlik doğrulama yapılmadı |
| 2 | Kimlik doğrulama başarısız |
| 3 | Güvenlik kontrolü başarısız |
| 6 | Müşteri işlemi iptal etti |
| 8 | Karta taksit yapılamaz |
| 9 | Kart ile işlem yetkisi yok |
| 10 | 3D Secure kullanılmalı |
| 11 | Fraud tespiti |
| 99 | Teknik entegrasyon hatası |

## İş Akışı

1. **Kullanıcı plan seçer** → Frontend
2. **Token oluştur** → POST /api/subscription/checkout/direct
3. **pending_subscriptions kaydı oluştur** → Database
4. **Kart bilgilerini al** → Frontend form
5. **PayTR'ye POST et** → Client-side (DOĞRUDAN PayTR'ye)
6. **3D Secure** → PayTR + Banka
7. **Callback al** → POST /api/subscription/checkout/callback
8. **Hash doğrula** → Güvenlik kontrolü
9. **Subscription oluştur/güncelle** → Database
10. **Usage limits güncelle** → Database
11. **Invoice oluştur** → Database
12. **Email gönder** → Notification
13. **OK yanıtı dön** → PayTR'ye

## Güvenlik Checklist

- [x] Kart bilgileri sunucuya gönderilmiyor
- [x] HMAC SHA256 token imzalama
- [x] Callback hash doğrulama zorunlu
- [x] Rate limiting aktif
- [x] Input validation (Luhn, CVV, expiry)
- [x] Idempotency kontrolü
- [x] HTTPS zorunlu (production)
- [x] SQL injection koruması (parameterized queries)
- [x] XSS koruması (input sanitization)
- [x] CSRF koruması (Next.js built-in)
- [x] Secure headers
- [x] Error handling (no sensitive info leak)

## Migration Notes

### Eski Sistem (iframe)
- Endpoint: `/api/subscription/checkout/initialize`
- Kullanıcı PayTR iframe'inde ödeme yapıyordu
- Kart bilgileri hiç görünmüyordu

### Yeni Sistem (Direct API)
- Endpoint: `/api/subscription/checkout/direct`
- Kullanıcı kendi formumuzda kart bilgilerini giriyor
- Kart bilgileri client-side'dan doğrudan PayTR'ye POST ediliyor
- Daha iyi UX, daha fazla kontrol

### Geriye Uyumluluk
Eski iframe endpoint'i korundu. İki sistem birlikte çalışabilir:
- Yeni kullanıcılar: Direct API
- Eski entegrasyonlar: iframe API (deprecated)

## Troubleshooting

### "Bildirim URL'den OK yanıtı alınamadı"
- Bildirim URL'inizin HTTPS olduğundan emin olun (SSL varsa)
- PayTR Panel > Ayarlar > Bildirim URL protokolünü kontrol edin
- Callback endpoint'inin "OK" döndüğünden emin olun

### "Invalid hash"
- merchant_key ve merchant_salt değerlerini kontrol edin
- Hash hesaplama sırasını kontrol edin (döküman sırası önemli)
- Token generation ve callback hash farklı sıralama kullanır

### "Test işlemi başarısız"
- Test kartlarını kullandığınızdan emin olun
- PAYTR_TEST_MODE=1 olmalı
- Kart bilgilerini tam ve doğru girin

## Önemli Notlar

1. **PCI DSS**: Kart bilgileri ASLA sunucumuza gelmez, kaydedilmez veya loglanmaz
2. **3D Secure**: Varsayılan olarak açık (güvenlik için önerilir)
3. **Webhook Retry**: PayTR OK alamazsa webhook'u tekrar gönderir
4. **Idempotency**: Duplicate webhook'lar güvenli bir şekilde handle edilir
5. **SSL**: Production'da HTTPS zorunludur

## Support

Sorularınız için:
- PayTR Destek: Mağaza Paneli > Destek
- Teknik Dokümantasyon: `/docs/paytr/`
