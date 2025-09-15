# Supabase E-posta Şablonları Kurulum Rehberi

Bu rehber, KrediTakip uygulaması için Supabase e-posta şablonlarının kurulumunu açıklar.

## Kurulum Adımları

### 1. Supabase Dashboard'a Giriş
1. https://supabase.com/dashboard adresine gidin
2. KrediTakip projenizi seçin
3. Sol menüden **Authentication** > **Email Templates** seçin

### 2. Şifre Sıfırlama E-posta Şablonu

**Template:** Reset Password
**Subject:** `KrediTakip - Şifre Sıfırlama Talebi`

**HTML Body:**
\`\`\`html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Şifre Sıfırlama</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #059669, #0d9488);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .button:hover {
            background: linear-gradient(135deg, #047857, #0f766e);
        }
        .link-text {
            font-size: 14px;
            color: #6b7280;
            word-break: break-all;
            background: #f3f4f6;
            padding: 10px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">KrediTakip</div>
            <h1 class="title">Şifre Sıfırlama Talebi</h1>
        </div>
        
        <div class="content">
            <p>Merhaba,</p>
            <p>KrediTakip hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifre belirlemek için aşağıdaki butona tıklayın:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Şifremi Sıfırla</a>
            </div>
            
            <p>Eğer buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
            <div class="link-text">{{ .ConfirmationURL }}</div>
            
            <div class="warning">
                <strong>Güvenlik Uyarısı:</strong> Bu bağlantı 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </div>
        </div>
        
        <div class="footer">
            <p>İyi günler,<br><strong>KrediTakip Ekibi</strong></p>
            <p style="margin-top: 20px; font-size: 12px;">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
            </p>
        </div>
    </div>
</body>
</html>
\`\`\`

### 3. E-posta Doğrulama Şablonu

**Template:** Confirm Signup
**Subject:** `KrediTakip - E-posta Adresinizi Doğrulayın`

**HTML Body:**
\`\`\`html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-posta Doğrulama</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .welcome {
            font-size: 20px;
            color: #059669;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #059669, #0d9488);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .button:hover {
            background: linear-gradient(135deg, #047857, #0f766e);
        }
        .link-text {
            font-size: 14px;
            color: #6b7280;
            word-break: break-all;
            background: #f3f4f6;
            padding: 10px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .features {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .features h3 {
            color: #059669;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .features ul {
            margin: 0;
            padding-left: 20px;
        }
        .features li {
            margin-bottom: 8px;
            color: #065f46;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">KrediTakip</div>
            <h1 class="title">E-posta Adresinizi Doğrulayın</h1>
            <div class="welcome">KrediTakip'e Hoş Geldiniz! 🎉</div>
        </div>
        
        <div class="content">
            <p>Merhaba,</p>
            <p>KrediTakip hesabınızı oluşturduğunuz için teşekkür ederiz! Hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekiyor.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">E-posta Adresimi Doğrula</a>
            </div>
            
            <p>Eğer buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
            <div class="link-text">{{ .ConfirmationURL }}</div>
            
            <div class="features">
                <h3>KrediTakip ile neler yapabilirsiniz?</h3>
                <ul>
                    <li>💳 Kredi kartı ve kredilerinizi tek yerden takip edin</li>
                    <li>📊 Ödeme planlarınızı yönetin ve hatırlatıcılar alın</li>
                    <li>🤖 AI destekli finansal analiz ve öneriler</li>
                    <li>📱 Mobil uyumlu arayüz ile her yerden erişim</li>
                    <li>🔒 Güvenli ve şifreli veri saklama</li>
                </ul>
            </div>
            
            <div class="warning">
                <strong>Önemli:</strong> Bu bağlantı 24 saat geçerlidir. E-posta doğrulaması yapılmadan hesabınıza tam erişim sağlayamazsınız.
            </div>
        </div>
        
        <div class="footer">
            <p>İyi günler,<br><strong>KrediTakip Ekibi</strong></p>
            <p style="margin-top: 20px; font-size: 12px;">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
            </p>
        </div>
    </div>
</body>
</html>
\`\`\`

### 4. Redirect URL Ayarları

Supabase Dashboard'da **Authentication** > **URL Configuration** bölümünde aşağıdaki URL'leri ekleyin:

#### Production URLs:
\`\`\`
https://kreditakip.com.tr/auth/callback
https://kreditakip.com.tr/auth/verify-email
https://kreditakip.com.tr/yeni-sifre
https://kreditakip.com.tr/uygulama/ana-sayfa
\`\`\`

#### Development URLs:
\`\`\`
http://localhost:3000/auth/callback
http://localhost:3000/auth/verify-email
http://localhost:3000/yeni-sifre
http://localhost:3000/uygulama/ana-sayfa
\`\`\`

### 5. Şifre Sıfırlama Redirect URL Güncelleme

Mevcut şifre sıfırlama kodlarında redirect URL'yi güncelleyin:

\`\`\`typescript
// Eski: /auth/reset-password
// Yeni: /yeni-sifre

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/yeni-sifre`,
})
\`\`\`

### 6. Test Etme

#### E-posta Doğrulama Testi:
1. Yeni bir hesap oluşturun
2. E-posta gelip gelmediğini kontrol edin
3. Doğrulama bağlantısına tıklayın
4. `/auth/verify-email` sayfasına yönlendirildiğini kontrol edin

#### Şifre Sıfırlama Testi:
1. `/sifremi-unuttum` sayfasına gidin
2. E-posta adresinizi girin
3. E-posta gelip gelmediğini kontrol edin
4. Şifre sıfırlama bağlantısına tıklayın
5. `/yeni-sifre` sayfasına yönlendirildiğini kontrol edin

### 7. Sorun Giderme

#### E-posta Gelmiyor:
- Spam klasörünü kontrol edin
- Supabase Dashboard > Logs sekmesinden hata mesajlarını kontrol edin
- SMTP ayarlarının doğru olduğundan emin olun

#### Redirect Çalışmıyor:
- URL'lerin tam olarak eşleştiğinden emin olun
- HTTPS/HTTP protokollerinin doğru olduğunu kontrol edin
- Browser cache'ini temizleyin

#### Template Görünmüyor:
- HTML kodunun doğru yapıştırıldığından emin olun
- Template'i kaydetmeyi unutmayın
- Test e-postası göndererek kontrol edin

### 8. Önemli Notlar

- E-posta şablonları HTML formatında olmalıdır
- `{{ .ConfirmationURL }}` değişkeni Supabase tarafından otomatik olarak doldurulur
- Template'lerde Türkçe karakter desteği için UTF-8 encoding kullanın
- Responsive tasarım için CSS media queries ekleyebilirsiniz
- E-posta istemcileri CSS desteği sınırlı olduğu için inline CSS kullanın

Bu rehberi takip ederek KrediTakip uygulamanız için profesyonel e-posta şablonları kurabilirsiniz.
