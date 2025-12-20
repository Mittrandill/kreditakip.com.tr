# Paddle Review Beklerken Sandbox Kullanımı

Paddle hesabınız onaylanana kadar LIVE mode çalışmayacaktır. Bu döküman geçici olarak Sandbox mode'a nasıl geçeceğinizi açıklar.

## ⚠️ Önemli Bilgi

Paddle hesabı **review aşamasında** (3/4 veya 4/4) olsa bile, **tam onaylanmadan** LIVE mode çalışmaz:
- ❌ Live API key'ler çalışmaz
- ❌ Live checkout açılmaz
- ❌ "Something went wrong" hatası alırsınız
- ✅ Sadece Sandbox mode çalışır

## 🔄 Sandbox Mode'a Geçiş

### 1. Paddle Dashboard'dan Sandbox Credentials Alın

#### A. Client Token (Frontend için)

1. Paddle Dashboard → **Developer Tools** → **Authentication**
2. Üstteki environment dropdown'dan **Sandbox** seçin
3. **Client-side tokens** bölümünden token oluşturun/kopyalayın
4. Format: `test_xxx...` (test_ ile başlar)

#### B. API Key (Backend için)

1. Aynı sayfada, **API keys** bölümüne gidin
2. Sandbox için API key oluşturun/kopyalayın
3. Format: `pdl_sdbx_xxx...` (pdl_sdbx_ ile başlar)

#### C. Webhook Secret

1. **Notifications** → **Notification destinations**
2. Üstteki environment dropdown'dan **Sandbox** seçin
3. Yeni destination oluşturun:
   - URL: `https://www.kreditakip.com.tr/api/paddle/webhooks`
   - Events: `subscription.*`, `transaction.completed`, `transaction.failed`
4. Secret key'i kopyalayın
5. Format: `pdl_ntfset_xxx...`

### 2. Vercel Environment Variables Güncelleyin

Vercel Dashboard → Settings → Environment Variables:

```bash
# SANDBOX MODE AYARLARI
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx...          # Adım 1A'dan
PADDLE_API_KEY=pdl_sdbx_xxx...                       # Adım 1B'den
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...              # Adım 1C'den
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://sandbox-buy.paddle.com/checkout
```

**Önemli:**
- Tüm değişkenleri **Production** environment'ına ekleyin
- Değerleri güncelledikten sonra **Redeploy** yapın

### 3. Database Price ID'lerini Sandbox'a Çevirin

⚠️ **DİKKAT:** Eğer database'de zaten live price ID'ler varsa, sandbox price ID'leri ile değiştirmeniz gerekir.

**İki seçenek:**

#### Seçenek A: Sandbox Price'ları Oluşturun (Önerilen)

1. Paddle Dashboard'da **Sandbox** environment'ına geçin
2. **Catalog** → **Products** ve **Prices** bölümünden aynı planları oluşturun
3. Sandbox price ID'lerini alın
4. Database'i güncelleyin:

```sql
-- Sandbox price ID'leri (Paddle Dashboard'dan alın)
UPDATE subscription_plans SET paddle_price_id = 'pri_sandbox_xxx' WHERE id = 'pro-monthly';
UPDATE subscription_plans SET paddle_price_id = 'pri_sandbox_xxx' WHERE id = 'pro-yearly';
UPDATE subscription_plans SET paddle_price_id = 'pri_sandbox_xxx' WHERE id = 'premium-monthly';
UPDATE subscription_plans SET paddle_price_id = 'pri_sandbox_xxx' WHERE id = 'premium-yearly';
```

#### Seçenek B: Live Price ID'leri Sakla (Geçici)

Live price ID'lerinizi bir yere not edin. Paddle onaylandıktan sonra geri yüklersiniz.

### 4. Test Edin

1. Vercel deployment tamamlandıktan sonra `https://www.kreditakip.com.tr/uygulama/premium` sayfasına gidin
2. Hard refresh: `Ctrl + Shift + R`
3. Bir plan seçin ve checkout'a tıklayın
4. Sandbox checkout penceresi açılmalı

**Sandbox Test Kartı:**
```
Kart Numarası: 4242 4242 4242 4242
CVV: 100
Tarih: Gelecekte herhangi bir tarih
```

## 🎉 Paddle Onaylandıktan Sonra

Paddle hesabınız tam onaylandığında (email gelecek):

### 1. Live Credentials'ı Alın

Tekrar:
- Client Token: `live_xxx...`
- API Key: `pdl_live_apikey_xxx...` (Zaten var)
- Webhook Secret: Live environment için yeni oluşturun

### 2. Vercel Environment Variables'ı Live'a Çevirin

```bash
# LIVE MODE AYARLARI
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx...          # Live client token
PADDLE_API_KEY=pdl_live_apikey_xxx...                # Zaten var
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...              # Live webhook secret
NEXT_PUBLIC_PADDLE_CHECKOUT_URL=https://buy.paddle.com/checkout
```

### 3. Database Price ID'lerini Live'a Çevirin

```bash
node scripts/update-live-paddle-plans.js
```

### 4. Redeploy ve Test

- Vercel'de redeploy yapın
- Gerçek bir test ödemesi yapın
- Webhook'ların çalıştığını kontrol edin

## 📊 Paddle Review Süreci

Paddle hesap onayı genellikle:
- ⏱️ **24-48 saat** sürer
- 📧 Email ile bildirim gelir
- ✅ 4/4 aşama tamamlandığında aktif olur

**Review sırasında ne yapabilirsiniz:**
- ✅ Sandbox'ta test edin
- ✅ Entegrasyonu geliştirin
- ✅ Webhook'ları test edin
- ❌ Gerçek ödemeler alamazsınız

## 🔍 Paddle Onay Durumunu Kontrol

1. Paddle Dashboard → Settings → Account
2. **Verification Status** bölümüne bakın
3. Eksik adımlar varsa tamamlayın

## ⚡ Hızlı Geçiş Scripti

Sandbox ↔ Live geçişlerini kolaylaştırmak için:

```bash
# Sandbox'a geç
export NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
export NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx
export PADDLE_API_KEY=pdl_sdbx_xxx
export PADDLE_WEBHOOK_SECRET=pdl_ntfset_sandbox_xxx

# Live'a geç (Onaylandıktan sonra)
export NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
export NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx
export PADDLE_API_KEY=pdl_live_apikey_xxx
export PADDLE_WEBHOOK_SECRET=pdl_ntfset_live_xxx
```

## 📞 Sorun mu Var?

- Paddle hesabı 48 saatten uzun süredir onaylanmadıysa: [Paddle Support](https://www.paddle.com/support)
- Sandbox çalışmıyorsa: `docs/PADDLE_TROUBLESHOOTING.md` dosyasına bakın
- Teknik sorunlar: Browser console'daki hata mesajını paylaşın

---

💡 **Sonuç:** Paddle onaylanana kadar sandbox kullanın, onaylandıktan sonra live'a geçin!
