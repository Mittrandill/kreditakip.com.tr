# Supabase Auth URL Ayarları

Bu dosya, Supabase Authentication için gerekli URL ayarlarını içerir.

## Supabase Dashboard'da Ayarlanması Gereken URL'ler

### 1. Site URL
**Authentication > URL Configuration > Site URL**
\`\`\`
https://your-domain.com
\`\`\`
Geliştirme için:
\`\`\`
http://localhost:3000
\`\`\`

### 2. Redirect URLs
**Authentication > URL Configuration > Redirect URLs**

Aşağıdaki URL'leri ekleyin:

#### Production URLs:
\`\`\`
https://your-domain.com/auth/callback
https://your-domain.com/yeni-sifre
https://your-domain.com/uygulama/ana-sayfa
\`\`\`

#### Development URLs:
\`\`\`
http://localhost:3000/auth/callback
http://localhost:3000/yeni-sifre
http://localhost:3000/uygulama/ana-sayfa
\`\`\`

### 3. Email Templates

#### Email Confirmation Template
**Authentication > Email Templates > Confirm signup**

Subject: `KrediTakip - E-posta Adresinizi Doğrulayın`

Body:
\`\`\`html
<h2>KrediTakip'e Hoş Geldiniz!</h2>
<p>Merhaba,</p>
<p>KrediTakip hesabınızı oluşturduğunuz için teşekkür ederiz. E-posta adresinizi doğrulamak için aşağıdaki butona tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">E-posta Adresimi Doğrula</a></p>
<p>Eğer buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Bu bağlantı 24 saat geçerlidir.</p>
<p>İyi günler,<br>KrediTakip Ekibi</p>
\`\`\`

#### Password Reset Template
**Authentication > Email Templates > Reset password**

Subject: `KrediTakip - Şifre Sıfırlama`

Body:
\`\`\`html
<h2>Şifre Sıfırlama Talebi</h2>
<p>Merhaba,</p>
<p>KrediTakip hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifre belirlemek için aşağıdaki butona tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Şifremi Sıfırla</a></p>
<p>Eğer buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Bu bağlantı 1 saat geçerlidir.</p>
<p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<p>İyi günler,<br>KrediTakip Ekibi</p>
\`\`\`

### 4. Environment Variables

Aşağıdaki environment variable'ları projenize ekleyin:

\`\`\`env
# Geliştirme için
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Production için (otomatik olarak window.location.origin kullanılır)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

## Kurulum Adımları

1. **Supabase Dashboard'a gidin**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **Authentication ayarlarına gidin**
   - Sol menüden "Authentication" seçin
   - "URL Configuration" sekmesine tıklayın

3. **Site URL'yi ayarlayın**
   - Production domain'inizi girin
   - Geliştirme için localhost:3000 kullanın

4. **Redirect URL'leri ekleyin**
   - Yukarıdaki tüm URL'leri "Redirect URLs" bölümüne ekleyin
   - Her URL'yi ayrı satıra yazın

5. **Email Template'lerini güncelleyin**
   - "Email Templates" sekmesine gidin
   - "Confirm signup" ve "Reset password" template'lerini yukarıdaki içeriklerle güncelleyin

6. **Environment Variables'ları ayarlayın**
   - Vercel Dashboard'da environment variables'ları ekleyin
   - Geliştirme ortamında .env.local dosyasına ekleyin

## Test Etme

1. **E-posta Doğrulama Testi:**
   - Yeni bir hesap oluşturun
   - E-posta gelip gelmediğini kontrol edin
   - Doğrulama bağlantısına tıklayın

2. **Şifre Sıfırlama Testi:**
   - "Şifremi Unuttum" sayfasına gidin
   - E-posta adresinizi girin
   - E-posta gelip gelmediğini kontrol edin
   - Şifre sıfırlama bağlantısına tıklayın

## Sorun Giderme

### E-posta Gelmiyor
- Spam klasörünü kontrol edin
- Supabase Dashboard'da "Logs" sekmesinden hata mesajlarını kontrol edin
- SMTP ayarlarının doğru olduğundan emin olun

### Redirect Çalışmıyor
- URL'lerin tam olarak eşleştiğinden emin olun
- HTTPS/HTTP protokollerinin doğru olduğunu kontrol edin
- Supabase Dashboard'da "Redirect URLs" listesini kontrol edin

### Session Sorunları
- Browser cache'ini temizleyin
- Incognito/Private mode'da test edin
- Network sekmesinden API çağrılarını kontrol edin
