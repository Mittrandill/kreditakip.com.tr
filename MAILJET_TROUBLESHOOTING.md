# Mailjet Sorun Giderme Kılavuzu

## Bağlantı Hatası Alıyorsanız

### 1. Environment Variables Kontrolü

Vercel dashboard'da veya local `.env` dosyanızda şu değişkenlerin olduğundan emin olun:

\`\`\`env
MAILJET_API_KEY=your_api_key_here
MAILJET_SECRET_KEY=your_secret_key_here
\`\`\`

**Önemli:** 
- API Key ve Secret Key'i Mailjet dashboard'dan alın: https://app.mailjet.com/account/apikeys
- Değerleri kopyalarken başında/sonunda boşluk olmadığından emin olun
- Tırnak işareti kullanmayın

### 2. Mailjet Hesap Kontrolü

1. Mailjet hesabınızın aktif olduğundan emin olun
2. API Key'lerinizin doğru olduğunu kontrol edin
3. Mailjet dashboard'da "Sender Domains & Addresses" bölümünden `bildirim@kreditakip.com.tr` adresini doğrulayın

### 3. Console Log Kontrolü

Tarayıcınızın Developer Tools'unu açın (F12) ve Console sekmesine bakın:

\`\`\`
[v0] Contact form submitting...
[v0] Mailjet API Key exists: true
[v0] Mailjet Secret Key exists: true
\`\`\`

Eğer `false` görüyorsanız, environment variables düzgün yüklenmemiş demektir.

### 4. API Route Logları

Vercel deployment loglarında şu mesajları arayın:

\`\`\`
[v0] HATA: Mailjet API anahtarları eksik!
[v0] MAILJET_API_KEY: EKSİK
[v0] MAILJET_SECRET_KEY: EKSİK
\`\`\`

### 5. Yaygın Hatalar ve Çözümleri

#### Hata: "E-posta servisi yapılandırılmamış"
**Çözüm:** Environment variables eksik. Vercel dashboard'dan ekleyin ve redeploy yapın.

#### Hata: "E-posta servisi kimlik doğrulama hatası"
**Çözüm:** API Key veya Secret Key yanlış. Mailjet dashboard'dan kontrol edin.

#### Hata: "Mailjet API'ye erişilemiyor"
**Çözüm:** İnternet bağlantısı veya Mailjet servisi sorunu. Birkaç dakika bekleyip tekrar deneyin.

#### Hata: "statusCode: 401"
**Çözüm:** API credentials geçersiz. Yeni API Key oluşturun.

### 6. Test Endpoint

API'nin çalışıp çalışmadığını test etmek için:

\`\`\`bash
curl -X POST https://your-domain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Test message"
  }'
\`\`\`

### 7. Vercel'de Environment Variables Ekleme

1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. Settings > Environment Variables
4. Şu değişkenleri ekleyin:
   - `MAILJET_API_KEY`
   - `MAILJET_SECRET_KEY`
5. "Save" butonuna tıklayın
6. Deployments sekmesinden "Redeploy" yapın

### 8. Local Development

Local'de çalışıyorsanız:

1. `.env.local` dosyası oluşturun (root dizinde)
2. Environment variables'ları ekleyin
3. Development server'ı yeniden başlatın: `npm run dev`

### 9. Mailjet Sender Domain Doğrulama

1. Mailjet Dashboard > Account Settings > Sender Domains & Addresses
2. `kreditakip.com.tr` domain'ini ekleyin
3. DNS kayıtlarını domain sağlayıcınıza ekleyin
4. Doğrulama tamamlanana kadar bekleyin

### 10. İletişim

Sorun devam ederse:
- Vercel deployment loglarını kontrol edin
- Browser console'daki tüm `[v0]` loglarını kaydedin
- Mailjet dashboard'daki "Activity" sekmesini kontrol edin
