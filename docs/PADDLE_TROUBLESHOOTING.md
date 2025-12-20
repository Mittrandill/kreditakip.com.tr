# Paddle Troubleshooting Guide

Bu döküman Paddle ödeme sistemi ile ilgili yaygın sorunları ve çözümlerini içerir.

## 🔴 "Something went wrong" Hatası

### Olası Nedenler ve Çözümler

#### 1. Environment Variables Eksik veya Yanlış

**Kontrol:**
```bash
node scripts/verify-paddle-env.js
```

**Vercel'de Kontrol:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Şu değişkenlerin **PRODUCTION** environment için ayarlandığını kontrol edin:

```bash
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx...
PADDLE_API_KEY=live_xxx...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...
```

**Önemli:**
- ✅ `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` **live_** ile başlamalı (sandbox için **test_**)
- ✅ `PADDLE_API_KEY` **live_** ile başlamalı
- ✅ `PADDLE_WEBHOOK_SECRET` **pdl_ntfset_** ile başlamalı
- ✅ Environment değişkenlerini güncelledikten sonra **mutlaka redeploy** yapın

#### 2. CSP (Content Security Policy) Hatası

**Browser Console'da şu hatayı görüyorsanız:**
```
Loading the script 'https://cdn.paddle.com/...' violates the following Content Security Policy directive
```

**Çözüm:**
`next.config.mjs` dosyasında CSP headers güncellenmiş olmalı. Eğer hala hata alıyorsanız:

1. Hard refresh yapın: `Ctrl + Shift + R` (Windows) veya `Cmd + Shift + R` (Mac)
2. Vercel'de redeploy yapın
3. Browser cache'i temizleyin

#### 3. Paddle Client Token Geçersiz

**Browser Console'da kontrol:**
```javascript
console.log(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)
```

Eğer `undefined` dönüyorsa:
- Vercel'de değişken doğru yazılmış mı kontrol edin (typo olabilir)
- **NEXT_PUBLIC_** prefix'i var mı kontrol edin
- Redeploy yapın

#### 4. Price ID Hataları

**Database'de Price ID'leri kontrol:**
```bash
node scripts/test-paddle-live-config.js
```

**Paddle Dashboard'da kontrol:**
1. Paddle Dashboard → Catalog → Prices
2. Price ID'lerinin database'dekilerle eşleştiğini kontrol edin

**Price ID'leri güncelle:**
```bash
node scripts/update-live-paddle-plans.js
```

#### 5. Sandbox/Production Karışıklığı

**Kontrol listesi:**
- ✅ `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production` olmalı
- ✅ Client token **live_** ile başlamalı
- ✅ Price ID'ler production price'lar olmalı (**pri_01** ile başlar)
- ✅ Product ID'ler production product'lar olmalı (**pro_01** ile başlar)

## 🐛 Debug Adımları

### 1. Browser Console Kontrolü

**Chrome/Edge:**
1. `F12` tuşuna basın
2. **Console** tab'ına gidin
3. Hatalarıkullanıcıya gösterin

**Aranacak hatalar:**
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing`
- `Paddle initialization error`
- `CSP directive`
- `Failed to load Paddle script`

### 2. Network Tab Kontrolü

1. `F12` → **Network** tab
2. Checkout butonuna tıklayın
3. Kırmızı (failed) isteklere bakın

**Yaygın hatalar:**
- `403 Forbidden`: API key geçersiz
- `404 Not Found`: Price ID yanlış
- `401 Unauthorized`: Token geçersiz

### 3. Paddle Dashboard Kontrolü

**Webhook Events:**
1. Paddle Dashboard → Developer Tools → Notifications → Events
2. Webhook event'lerinin gelip gelmediğini kontrol edin

**API Logs:**
1. Paddle Dashboard → Developer Tools → API Log
2. Hatalı API çağrılarını kontrol edin

## 📋 Checklist

Paddle checkout çalışmıyorsa şu adımları sırayla takip edin:

- [ ] Vercel environment variables doğru ayarlı mı? (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN, vb.)
- [ ] Environment variables **production** environment'ına eklendi mi?
- [ ] Vercel'de son deploy başarılı mı?
- [ ] Browser console'da CSP hatası var mı?
- [ ] `next.config.mjs` CSP headers güncel mi?
- [ ] Paddle client token **live_** ile mi başlıyor?
- [ ] Database price ID'leri production price ID'leri mi?
- [ ] Paddle Dashboard'da price'lar active mi?
- [ ] Browser cache temizlendi mi?
- [ ] Hard refresh yapıldı mı? (Ctrl + Shift + R)

## 🔧 Hızlı Çözümler

### Çözüm 1: Environment Variables Reset

```bash
# Vercel CLI ile
vercel env rm NEXT_PUBLIC_PADDLE_CLIENT_TOKEN production
vercel env add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN production
# Token'ı yapıştır

# Redeploy
vercel --prod
```

### Çözüm 2: Cache Temizleme

1. Browser: `Ctrl + Shift + Delete` → Clear cache
2. Vercel: Dashboard → Deployments → Your Deployment → ... → Redeploy

### Çözüm 3: Price ID'leri Sync Et

```bash
node scripts/update-live-paddle-plans.js
```

## 📞 İleri Düzey Debug

### Paddle.js Manuel Test

Browser console'da:

```javascript
// 1. Paddle yüklendi mi?
console.log(window.Paddle)

// 2. Initialize edildi mi?
window.Paddle.Initialize({
  token: 'your_client_token_here',
  environment: 'production',
  eventCallback: (event) => console.log('Paddle event:', event)
})

// 3. Checkout aç (manuel test)
window.Paddle.Checkout.open({
  items: [{ priceId: 'pri_01kcrgn0119qmdrgdy92phf840', quantity: 1 }]
})
```

### API Test

```bash
# Paddle API'yi direkt test et
curl https://api.paddle.com/products \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## ⚠️ Yaygın Hatalar

### "Token is required"
**Neden:** `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` eksik
**Çözüm:** Vercel'de ekle ve redeploy yap

### "Invalid price ID"
**Neden:** Database'deki price ID production'da yok
**Çözüm:** Paddle Dashboard'dan doğru price ID'yi al ve database'i güncelle

### "Checkout.open is not a function"
**Neden:** Paddle.js yüklenmedi veya initialize edilmedi
**Çözüm:** CSP headers'ı kontrol et, client token'ı kontrol et

### "Network error"
**Neden:** API key geçersiz veya yanlış environment
**Çözüm:** API key'i kontrol et, sandbox/production karışıklığı olabilir

## 📚 Faydalı Linkler

- [Paddle Documentation](https://developer.paddle.com/)
- [Paddle.js Reference](https://developer.paddle.com/paddlejs/overview)
- [Paddle API Reference](https://developer.paddle.com/api-reference/overview)
- [Paddle Support](https://www.paddle.com/support)

## 💡 Best Practices

1. **Her zaman sandbox'ta önce test edin**
2. **Environment variables'ı değiştirdikten sonra redeploy yapın**
3. **Browser cache'i temiz tutun**
4. **Paddle Dashboard'da activity log'ları düzenli kontrol edin**
5. **Webhook'ların çalıştığını test edin**
