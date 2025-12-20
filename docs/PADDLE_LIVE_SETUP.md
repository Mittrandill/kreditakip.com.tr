# Paddle Live Mode Setup Guide

Bu döküman, Paddle ödeme sistemini sandbox'tan LIVE moda geçirmek için gereken tüm adımları içerir.

## 📋 Gerekli Bilgiler Listesi

Paddle Dashboard'dan aşağıdaki bilgileri toplamalısınız:

### 1. Authentication Keys (Developer Tools > Authentication)

| Key Adı | Açıklama | Format | Nerede? |
|---------|----------|--------|---------|
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Frontend için client-side token | `live_...` | Paddle Dashboard > Developer Tools > Authentication > Client-side tokens |
| `PADDLE_API_KEY` | Backend API çağrıları için server-side key | `live_...` | Paddle Dashboard > Developer Tools > Authentication > API keys |

### 2. Webhook Configuration (Notifications)

| Key Adı | Açıklama | Nerede? |
|---------|----------|---------|
| `PADDLE_WEBHOOK_SECRET` | Webhook imza doğrulama için secret key | Paddle Dashboard > Notifications > Notification destinations > Your webhook > Secret key |

## 🔧 Adım 1: Paddle Dashboard Konfigürasyonu

### A. Client-side Token Oluşturma

1. Paddle Dashboard'a gidin: https://vendors.paddle.com/
2. **Developer Tools** > **Authentication** > **Client-side tokens**
3. **"Create client-side token"** butonuna tıklayın
4. Token'ı kopyalayın (başında `live_` olmalı)
5. Bu değeri `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` olarak saklayın

### B. API Key Oluşturma

1. **Developer Tools** > **Authentication** > **API keys**
2. **"Create API key"** butonuna tıklayın
3. İsim verin (örn: "Production API Key")
4. **Gerekli izinler:**
   - `subscription:read`
   - `subscription:write`
   - `customer:read`
   - `customer:write`
   - `transaction:read`
   - `price:read`
   - `product:read`
5. API key'i kopyalayın (başında `live_` olmalı)
6. Bu değeri `PADDLE_API_KEY` olarak saklayın

### C. Webhook Destination Oluşturma

1. **Notifications** > **Notification destinations**
2. **"Create destination"** butonuna tıklayın
3. **Destination URL:** `https://www.kreditakip.com.tr/api/paddle/webhooks`
4. **Description:** "Production Webhook"
5. **Include sensitive fields:** ✅ Aktif edin
6. **Subscribed events:** Aşağıdaki event'leri seçin:
   - `subscription.created`
   - `subscription.activated`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
   - `transaction.completed`
   - `transaction.failed`
7. Destination'ı kaydedin
8. **Secret key**'i kopyalayın (başında `pdl_ntfset_` olmalı)
9. Bu değeri `PADDLE_WEBHOOK_SECRET` olarak saklayın

## 🌐 Adım 2: Vercel Environment Variables

### Vercel Dashboard'da Ayarlama

1. Vercel'de projenize gidin: https://vercel.com/dashboard
2. **Settings** > **Environment Variables**
3. Aşağıdaki değişkenleri ekleyin/güncelleyin:

```bash
# Paddle Environment
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production

# Paddle Client Token (Frontend)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx...

# Paddle API Key (Backend)
PADDLE_API_KEY=live_xxx...

# Paddle Webhook Secret
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...

# Paddle Checkout URL
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://buy.paddle.com/checkout
```

### Dikkat Edilmesi Gerekenler:

- ✅ **Production**, **Preview**, ve **Development** ortamları için ayrı ayrı ayarlayın
- ✅ Development ortamında sandbox değerleri kullanın
- ✅ Tüm değerlerin başındaki/sonundaki boşlukları temizleyin
- ✅ `NEXT_PUBLIC_` prefix'li değişkenler frontend'de görünür olur

## 💻 Adım 3: Local Development Setup

`.env.local` dosyanızı oluşturun veya güncelleyin:

```bash
# Paddle Live Mode
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx...
PADDLE_API_KEY=live_xxx...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://buy.paddle.com/checkout
```

**NOT:** Local test için sandbox kullanmak isterseniz:

```bash
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx...
PADDLE_API_KEY=test_xxx...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx... (sandbox webhook secret)
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://sandbox-buy.paddle.com/checkout
```

## ✅ Adım 4: Database Güncelleme

Database'deki price ID'lerini live moda güncellemek için:

```bash
node scripts/update-live-paddle-plans.js
```

Bu script şu güncellemeleri yapar:

| Plan | Product ID | Price ID |
|------|------------|----------|
| Pro Monthly | `pro_01kcrgadnmnknkz1c32yd50t5t` | `pri_01kcrgqgnatmmafk81qb9skdv2` |
| Pro Yearly | `pro_01kcrgadnmnknkz1c32yd50t5t` | `pri_01kcrgrk0481d1wgrxw1gspqfq` |
| Premium Monthly | `pro_01kcrga40mwkf0t80drbe06rbd` | `pri_01kcrgn0119qmdrgdy92phf840` |
| Premium Yearly | `pro_01kcrga40mwkf0t80drbe06rbd` | `pri_01kcrgdk1qex8pbyc2g47fv5dg` |

## 🧪 Adım 5: Test Etme

### A. Local Test

1. Development server'ı başlatın:
   ```bash
   pnpm dev
   ```

2. Premium sayfasına gidin: http://localhost:3000/uygulama/premium

3. Paddle checkout açılıyor mu kontrol edin

4. Test kartı ile ödeme yapın:
   - Kart numarası: `4242 4242 4242 4242`
   - CVV: `100`
   - Tarih: Gelecekte herhangi bir tarih

### B. Production Test

1. Vercel'de deploy edin:
   ```bash
   git add .
   git commit -m "feat: enable Paddle live mode"
   git push
   ```

2. Production URL'e gidin: https://www.kreditakip.com.tr/uygulama/premium

3. Gerçek ödeme ile test edin (küçük bir tutar)

### C. Webhook Test

1. Paddle Dashboard > Notifications > Notification destinations
2. Webhook destination'ınızı bulun
3. **"Send test event"** butonuna tıklayın
4. `subscription.created` event'ini gönderin
5. Vercel logs'larında webhook gelip gelmediğini kontrol edin

## 🔍 Doğrulama Checklist

- [ ] Paddle Dashboard'da live API key'leri oluşturuldu
- [ ] Webhook destination oluşturuldu ve doğru URL'e işaret ediyor
- [ ] Vercel environment variables güncellendi
- [ ] Database price ID'leri güncellendi
- [ ] Local'de checkout açılıyor
- [ ] Production'da checkout açılıyor
- [ ] Webhook test event'i başarıyla alınıyor
- [ ] Test ödemesi başarıyla tamamlanıyor
- [ ] Ödeme sonrası subscription database'e kaydediliyor

## 🚨 Sorun Giderme

### Problem: "Paddle is not defined" hatası

**Çözüm:**
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` değişkeninin doğru ayarlandığından emin olun
- Browser console'da token değerini kontrol edin
- Sayfayı yenileyin

### Problem: "Invalid signature" webhook hatası

**Çözüm:**
- `PADDLE_WEBHOOK_SECRET` değişkeninin doğru olduğundan emin olun
- Paddle Dashboard'da webhook secret'i tekrar kontrol edin
- Vercel'de environment variable'ı güncelleyin ve redeploy yapın

### Problem: Checkout açılmıyor

**Çözüm:**
- Browser console'da hata mesajlarına bakın
- `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production` olduğundan emin olun
- Price ID'lerinin database'de doğru güncellendiğini kontrol edin

### Problem: Ödeme başarılı ama subscription oluşmadı

**Çözüm:**
- Webhook'un düzgün çalıştığından emin olun
- `paddle_webhook_events` tablosunda event'lerin kaydedildiğini kontrol edin
- Supabase logs'larında hata olup olmadığına bakın

## 📞 Destek

Sorun yaşıyorsanız:

1. Paddle Dashboard > Help & Support
2. Paddle documentation: https://developer.paddle.com/
3. Proje repository'sinde issue açın

## 🎉 Tamamlandı!

Paddle live mode başarıyla aktif edildi! Artık gerçek ödemeler alabilirsiniz.

**Önemli Hatırlatmalar:**

- ⚠️ Sandbox ve production API key'lerini karıştırmayın
- ⚠️ Webhook secret'i güvenli tutun, kimseyle paylaşmayın
- ⚠️ İlk birkaç gerçek ödemede sistem davranışını yakından izleyin
- ⚠️ Paddle Dashboard'da ödeme raporlarını düzenli kontrol edin
