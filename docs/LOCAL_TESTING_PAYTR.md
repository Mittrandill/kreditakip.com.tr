# PayTR Direct API - Local Testing Rehberi

## Neden ngrok?

PayTR webhook callback'lerini test etmek için **gerçek bir HTTPS URL'ye** ihtiyacınız var. Local development'ta `localhost:3000` kullanıyorsunuz, ancak PayTR bu URL'e ulaşamaz.

**ngrok** = Local sunucunuzu internete açan güvenli bir tunnel

## Kurulum

### 1. ngrok'u İndirin

```bash
# Homebrew ile (macOS)
brew install ngrok/ngrok/ngrok

# Veya manuel indirme
# https://ngrok.com/download
```

### 2. ngrok Hesabı Oluşturun

1. https://dashboard.ngrok.com/signup adresinden ücretsiz hesap oluşturun
2. Auth token'ınızı alın: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Auth Token'ı Ayarlayın

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Local Test için Adımlar

### 1. Development Server'ı Başlatın

```bash
npm run dev
```

Server `http://localhost:3000` adresinde çalışacak.

### 2. ngrok Tunnel'ı Açın

Yeni bir terminal açın ve:

```bash
ngrok http 3000
```

Çıktı şöyle olacak:

```
ngrok                                                                                                                                                             (Ctrl+C to quit)

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        Europe (eu)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**ÖNEMLİ:** `https://abc123def456.ngrok-free.app` URL'ini kopyalayın!

### 3. PayTR Panel'de Callback URL'i Güncelleyin

1. PayTR Mağaza Paneli'ne girin
2. **Ayarlar > Bildirim Ayarları** bölümüne gidin
3. **Bildirim URL (Callback)** alanına ngrok URL'inizi girin:
   ```
   https://abc123def456.ngrok-free.app/api/subscription/checkout/callback
   ```
4. Kaydedin

### 4. Test Ödemesi Yapın

1. Tarayıcınızda ngrok URL'ini açın:
   ```
   https://abc123def456.ngrok-free.app/uygulama/odeme?plan=premium-yearly
   ```

2. Fatura bilgilerini doldurun

3. Test kartı ile ödeme yapın:
   ```
   Kart No: 4355 0843 5508 4358
   Ad: PAYTR TEST
   Tarih: 12/24
   CVV: 000
   ```

4. 3D Secure sayfasından onaylayın

5. PayTR webhook'u ngrok URL'inize gönderecek!

### 5. Webhook Loglarını İzleyin

**Terminal'de:**
```bash
# Server loglarını izleyin
npm run dev
```

**ngrok Web Interface'de:**
- Tarayıcınızda açın: http://127.0.0.1:4040
- Tüm gelen istekleri görebilirsiniz
- Request/response detaylarını inceleyebilirsiniz

**Database'de:**
```sql
-- Subscription oluşturuldu mu?
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;

-- Billing info kaydedildi mi?
SELECT * FROM billing_info ORDER BY created_at DESC LIMIT 1;
```

## Yaygın Sorunlar

### ngrok URL'i Her Seferinde Değişiyor

**Sorun:** Free plan'de URL her restart'ta değişir.

**Çözümler:**
1. **Paid Plan** ($8/ay): Sabit subdomain alın (`your-app.ngrok.io`)
2. **Test için geçici:** Her seferinde PayTR panel'de URL'i güncelleyin
3. **Production:** Gerçek domain kullanın, ngrok'a gerek kalmaz

### ngrok "Too Many Connections"

**Sorun:** Free plan sınırına ulaştınız.

**Çözüm:**
```bash
# ngrok'u yeniden başlatın
# Ctrl+C ile durdurun, sonra tekrar:
ngrok http 3000
```

### PayTR Webhook Gelmiyor

**Kontroller:**
1. ngrok çalışıyor mu? Terminal'de "Forwarding" satırını görüyor musunuz?
2. PayTR panel'deki URL doğru mu? `/api/subscription/checkout/callback` ile bitiyor mu?
3. Server çalışıyor mu? `npm run dev` çıktısını kontrol edin
4. ngrok web interface'de (http://127.0.0.1:4040) istek görünüyor mu?

### "Invalid Hash" Hatası

**Sorun:** PayTR webhook hash doğrulaması başarısız.

**Kontrol Edin:**
```bash
# .env.local dosyanızda
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt
```

Bu değerler PayTR Panel > Ayarlar > API Bilgilerim'den alınmalı.

## Production'a Geçiş

Production'da ngrok kullanmayın! Gerçek domain kullanın:

```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://kreditakip.com.tr
```

PayTR Panel'de callback URL:
```
https://kreditakip.com.tr/api/subscription/checkout/callback
```

## Alternatif: localtunnel

ngrok yerine alternatif:

```bash
npm install -g localtunnel
lt --port 3000
```

Ancak ngrok daha stabil ve daha iyi debugging tools sunar.

## Özet Komutlar

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: ngrok tunnel
ngrok http 3000

# PayTR Panel
# Callback URL: https://YOUR_NGROK_URL.ngrok-free.app/api/subscription/checkout/callback

# Test URL
# https://YOUR_NGROK_URL.ngrok-free.app/uygulama/odeme?plan=premium-yearly
```

## Debug İpuçları

1. **Server logs:** Terminal'de request loglarını kontrol edin
2. **ngrok interface:** http://127.0.0.1:4040 - Tüm istekleri görün
3. **Database:** Supabase dashboard'da subscription ve billing_info tablolarını kontrol edin
4. **Browser console:** Network tab'da hataları görün
5. **PayTR panel:** İşlem geçmişi > Detay > Bildirim Durumu

## Güvenlik Notu

ngrok free plan public URL oluşturur. **Hassas datayı test etmeyin!** Test kartları ve dummy data kullanın.

Production credentials yerine **test mode** credentials kullanın:
```bash
PAYTR_TEST_MODE=1
```
