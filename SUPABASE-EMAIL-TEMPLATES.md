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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: linear-gradient(135deg, #151515 0%, #1a1a1a 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #151515 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Header with Logo */
        .header {
            background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 20px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .logo img {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }
        .brand-name {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
        }
        .brand-tagline {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            margin-top: 5px;
            position: relative;
            z-index: 2;
        }
        
        /* Content Area */
        .content {
            padding: 50px 40px;
            background: #151515;
            position: relative;
        }
        .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #059669 50%, transparent 100%);
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 25px;
            text-align: center;
            line-height: 1.3;
        }
        .title .highlight {
            color: #10b981;
            background: linear-gradient(135deg, #059669, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .greeting {
            font-size: 18px;
            color: #ffffff;
            margin-bottom: 25px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 35px;
            line-height: 1.7;
        }
        
        /* CTA Button */
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: #ffffff;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .cta-button:hover::before {
            left: 100%;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(5, 150, 105, 0.6);
            background: linear-gradient(135deg, #047857 0%, #059669 100%);
        }
        
        /* Link Fallback */
        .link-fallback {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .link-fallback-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 10px;
        }
        .link-text {
            font-size: 13px;
            color: #10b981;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            background: rgba(16, 185, 129, 0.1);
            padding: 10px;
            border-radius: 6px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        /* Security Warning */
        .security-warning {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            position: relative;
        }
        .security-warning::before {
            content: '⚠️';
            position: absolute;
            top: -10px;
            left: 20px;
            background: #151515;
            padding: 0 10px;
            font-size: 20px;
        }
        .security-warning-title {
            font-weight: 700;
            color: #f59e0b;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .security-warning-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            background: #0a0a0a;
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-brand {
            font-size: 18px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 10px;
        }
        .footer-team {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
        }
        .footer-note {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
        }
        .footer-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-link {
            color: #10b981;
            text-decoration: none;
            font-size: 12px;
            margin: 0 15px;
        }
        .footer-link:hover {
            color: #059669;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 25px;
            }
            .footer {
                padding: 30px 20px;
            }
            .brand-name {
                font-size: 28px;
            }
            .title {
                font-size: 24px;
            }
            .cta-button {
                padding: 16px 30px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo-container">
                <div class="logo">
                    <img src="https://kreditakip.com.tr/logo.png" alt="KrediTakip Logo" />
                </div>
                <div class="brand-name">KrediTakip</div>
                <div class="brand-tagline">Kredi Yönetiminin Geleceği</div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1 class="title">
                <span class="highlight">Şifre Sıfırlama</span> Talebi
            </h1>
            
            <div class="greeting">Merhaba,</div>
            
            <div class="message">
                KrediTakip hesabınız için şifre sıfırlama talebinde bulundunuz. Güvenliğiniz bizim için önemli olduğu için, yeni şifrenizi belirlemek için aşağıdaki güvenli bağlantıyı kullanmanız gerekmektedir.
            </div>
            
            <!-- CTA Button -->
            <div class="cta-container">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    🔐 Şifremi Sıfırla
                </a>
            </div>
            
            <!-- Link Fallback -->
            <div class="link-fallback">
                <div class="link-fallback-title">Buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</div>
                <div class="link-text">{{ .ConfirmationURL }}</div>
            </div>
            
            <!-- Security Warning -->
            <div class="security-warning">
                <div class="security-warning-title">Güvenlik Uyarısı</div>
                <div class="security-warning-text">
                    • Bu bağlantı sadece 1 saat geçerlidir<br>
                    • Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz<br>
                    • Şifreniz değiştirilmeyecek ve hesabınız güvende kalacaktır
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">KrediTakip</div>
            <div class="footer-team">KrediTakip Ekibi</div>
            <div class="footer-note">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br>
                Sorularınız için destek@kreditakip.com.tr adresine yazabilirsiniz.
            </div>
            <div class="footer-links">
                <a href="https://kreditakip.com.tr" class="footer-link">Ana Sayfa</a>
                <a href="https://kreditakip.com.tr/gizlilik" class="footer-link">Gizlilik</a>
                <a href="https://kreditakip.com.tr/destek" class="footer-link">Destek</a>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

### 3. E-posta Doğrulama Şablonu

**Template:** Confirm Signup
**Subject:** `KrediTakip'e Hoş Geldiniz! E-posta Adresinizi Doğrulayın 🎉`

**HTML Body:**
\`\`\`html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-posta Doğrulama</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: linear-gradient(135deg, #151515 0%, #1a1a1a 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #151515 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Header with Logo */
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 20px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .logo img {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }
        .brand-name {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
        }
        .brand-tagline {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            margin-top: 5px;
            position: relative;
            z-index: 2;
        }
        .welcome-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 2;
        }
        
        /* Content Area */
        .content {
            padding: 50px 40px;
            background: #151515;
            position: relative;
        }
        .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%);
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 25px;
            text-align: center;
            line-height: 1.3;
        }
        .title .highlight {
            color: #10b981;
            background: linear-gradient(135deg, #059669, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .greeting {
            font-size: 18px;
            color: #ffffff;
            margin-bottom: 25px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 35px;
            line-height: 1.7;
        }
        
        /* CTA Button */
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .cta-button:hover::before {
            left: 100%;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6);
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
        
        /* Features Section */
        .features-section {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 15px;
            padding: 30px;
            margin: 35px 0;
            position: relative;
        }
        .features-section::before {
            content: '✨';
            position: absolute;
            top: -12px;
            left: 30px;
            background: #151515;
            padding: 0 10px;
            font-size: 20px;
        }
        .features-title {
            color: #10b981;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .feature-icon {
            font-size: 20px;
            margin-top: 2px;
        }
        .feature-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
        }
        
        /* Link Fallback */
        .link-fallback {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .link-fallback-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 10px;
        }
        .link-text {
            font-size: 13px;
            color: #10b981;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            background: rgba(16, 185, 129, 0.1);
            padding: 10px;
            border-radius: 6px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        /* Important Notice */
        .important-notice {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            position: relative;
        }
        .important-notice::before {
            content: '⏰';
            position: absolute;
            top: -10px;
            left: 20px;
            background: #151515;
            padding: 0 10px;
            font-size: 20px;
        }
        .important-notice-title {
            font-weight: 700;
            color: #f59e0b;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .important-notice-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            background: #0a0a0a;
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-brand {
            font-size: 18px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 10px;
        }
        .footer-team {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
        }
        .footer-note {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
        }
        .footer-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-link {
            color: #10b981;
            text-decoration: none;
            font-size: 12px;
            margin: 0 15px;
        }
        .footer-link:hover {
            color: #059669;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 25px;
            }
            .footer {
                padding: 30px 20px;
            }
            .brand-name {
                font-size: 28px;
            }
            .title {
                font-size: 24px;
            }
            .cta-button {
                padding: 16px 30px;
                font-size: 15px;
            }
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo-container">
                <div class="logo">
                    <img src="https://kreditakip.com.tr/logo.png" alt="KrediTakip Logo" />
                </div>
                <div class="brand-name">KrediTakip</div>
                <div class="brand-tagline">Kredi Yönetiminin Geleceği</div>
                <div class="welcome-badge">🎉 Hoş Geldiniz!</div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1 class="title">
                E-posta Adresinizi <span class="highlight">Doğrulayın</span>
            </h1>
            
            <div class="greeting">Merhaba ve KrediTakip ailesine hoş geldiniz! 👋</div>
            
            <div class="message">
                KrediTakip hesabınızı oluşturduğunuz için teşekkür ederiz! Finansal özgürlüğünüze giden yolculuğunuz başlıyor. Hesabınızı aktifleştirmek ve tüm özelliklerden yararlanmak için e-posta adresinizi doğrulamanız gerekiyor.
            </div>
            
            <!-- CTA Button -->
            <div class="cta-container">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    ✅ E-posta Adresimi Doğrula
                </a>
            </div>
            
            <!-- Features Section -->
            <div class="features-section">
                <div class="features-title">KrediTakip ile neler yapabilirsiniz?</div>
                <div class="features-grid">
                    <div class="feature-item">
                        <div class="feature-icon">💳</div>
                        <div class="feature-text">Kredi kartı ve kredilerinizi tek yerden takip edin</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text">Ödeme planlarınızı yönetin ve hatırlatıcılar alın</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🤖</div>
                        <div class="feature-text">AI destekli finansal analiz ve öneriler</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📱</div>
                        <div class="feature-text">Mobil uyumlu arayüz ile her yerden erişim</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔒</div>
                        <div class="feature-text">Bankacılık seviyesinde güvenlik</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-text">3 saniyede OCR ile döküm analizi</div>
                    </div>
                </div>
            </div>
            
            <!-- Link Fallback -->
            <div class="link-fallback">
                <div class="link-fallback-title">Buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</div>
                <div class="link-text">{{ .ConfirmationURL }}</div>
            </div>
            
            <!-- Important Notice -->
            <div class="important-notice">
                <div class="important-notice-title">Önemli Bilgi</div>
                <div class="important-notice-text">
                    • Bu doğrulama bağlantısı 24 saat geçerlidir<br>
                    • E-posta doğrulaması yapılmadan hesabınıza tam erişim sağlayamazsınız<br>
                    • Doğrulama sonrası tüm premium özellikler aktif olacaktır
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">KrediTakip</div>
            <div class="footer-team">KrediTakip Ekibi</div>
            <div class="footer-note">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br>
                Sorularınız için destek@kreditakip.com.tr adresine yazabilirsiniz.
            </div>
            <div class="footer-links">
                <a href="https://kreditakip.com.tr" class="footer-link">Ana Sayfa</a>
                <a href="https://kreditakip.com.tr/ozellikler" class="footer-link">Özellikler</a>
                <a href="https://kreditakip.com.tr/destek" class="footer-link">Destek</a>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

### 4. Davet E-posta Şablonu

**Template:** Invite User
**Subject:** `KrediTakip'e Davetlisiniz! 🎯`

**HTML Body:**
\`\`\`html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KrediTakip Daveti</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: linear-gradient(135deg, #151515 0%, #1a1a1a 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #151515 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Header with Logo */
        .header {
            background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 20px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .logo img {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }
        .brand-name {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
        }
        .brand-tagline {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            margin-top: 5px;
            position: relative;
            z-index: 2;
        }
        .invite-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 2;
        }
        
        /* Content Area */
        .content {
            padding: 50px 40px;
            background: #151515;
            position: relative;
        }
        .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #0d9488 50%, transparent 100%);
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 25px;
            text-align: center;
            line-height: 1.3;
        }
        .title .highlight {
            color: #0d9488;
            background: linear-gradient(135deg, #0d9488, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .greeting {
            font-size: 18px;
            color: #ffffff;
            margin-bottom: 25px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 35px;
            line-height: 1.7;
        }
        
        /* CTA Button */
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
            color: #ffffff;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 25px rgba(13, 148, 136, 0.4);
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .cta-button:hover::before {
            left: 100%;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(13, 148, 136, 0.6);
            background: linear-gradient(135deg, #0f766e 0%, #059669 100%);
        }
        
        /* Footer */
        .footer {
            background: #0a0a0a;
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-brand {
            font-size: 18px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 10px;
        }
        .footer-team {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
        }
        .footer-note {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
        }
        .footer-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-link {
            color: #10b981;
            text-decoration: none;
            font-size: 12px;
            margin: 0 15px;
        }
        .footer-link:hover {
            color: #059669;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 25px;
            }
            .footer {
                padding: 30px 20px;
            }
            .brand-name {
                font-size: 28px;
            }
            .title {
                font-size: 24px;
            }
            .cta-button {
                padding: 16px 30px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo-container">
                <div class="logo">
                    <img src="https://kreditakip.com.tr/logo.png" alt="KrediTakip Logo" />
                </div>
                <div class="brand-name">KrediTakip</div>
                <div class="brand-tagline">Kredi Yönetiminin Geleceği</div>
                <div class="invite-badge">🎯 Özel Davet</div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1 class="title">
                <span class="highlight">KrediTakip</span>'e Davetlisiniz!
            </h1>
            
            <div class="greeting">Merhaba,</div>
            
            <div class="message">
                {{ .Email }} tarafından KrediTakip'e davet edildiniz! Finansal özgürlüğünüze giden yolculukta size eşlik etmek için sabırsızlanıyoruz. KrediTakip ile kredi yönetiminizi bir sonraki seviyeye taşıyın.
            </div>
            
            <!-- CTA Button -->
            <div class="cta-container">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    🚀 Daveti Kabul Et
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">KrediTakip</div>
            <div class="footer-team">KrediTakip Ekibi</div>
            <div class="footer-note">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br>
                Sorularınız için destek@kreditakip.com.tr adresine yazabilirsiniz.
            </div>
            <div class="footer-links">
                <a href="https://kreditakip.com.tr" class="footer-link">Ana Sayfa</a>
                <a href="https://kreditakip.com.tr/ozellikler" class="footer-link">Özellikler</a>
                <a href="https://kreditakip.com.tr/destek" class="footer-link">Destek</a>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

### 5. Redirect URL Ayarları

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

### 6. Logo Kurulumu

E-posta şablonlarında kullanılan logo URL'si: `https://kreditakip.com.tr/logo.png`

**Logo gereksinimleri:**
- Format: PNG (şeffaf arka plan önerilir)
- Boyut: 200x200px (minimum)
- Dosya boyutu: <100KB
- Kare format (1:1 oran)

### 7. Kurumsal Renk Paleti

E-posta şablonlarında kullanılan renkler:

\`\`\`css
/* Ana Renkler */
--primary-green: #059669;      /* Ana yeşil */
--secondary-green: #10b981;    /* İkincil yeşil */
--accent-teal: #0d9488;        /* Vurgu teal */
--dark-green: #047857;         /* Koyu yeşil */

/* Arka Plan Renkleri */
--bg-primary: #151515;         /* Ana arka plan */
--bg-secondary: #1a1a1a;       /* İkincil arka plan */
--bg-tertiary: #0a0a0a;        /* Footer arka plan */

/* Metin Renkleri */
--text-primary: #ffffff;       /* Ana metin */
--text-secondary: rgba(255, 255, 255, 0.85);  /* İkincil metin */
--text-muted: rgba(255, 255, 255, 0.5);       /* Soluk metin */

/* Uyarı Renkleri */
--warning: #f59e0b;           /* Uyarı sarısı */
--warning-bg: rgba(245, 158, 11, 0.15);  /* Uyarı arka plan */
\`\`\`

### 8. Test Etme

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

### 9. Sorun Giderme

#### E-posta Gelmiyor:
- Spam klasörünü kontrol edin
- Supabase Dashboard > Logs sekmesinden hata mesajlarını kontrol edin
- SMTP ayarlarının doğru olduğundan emin olun

#### Logo Görünmüyor:
- Logo URL'sinin erişilebilir olduğunu kontrol edin
- Logo dosyasının doğru formatta olduğunu kontrol edin
- CDN veya hosting sağlayıcısının CORS ayarlarını kontrol edin

#### Responsive Sorunları:
- E-posta istemcileri CSS desteği sınırlıdır
- Inline CSS kullanın
- Media queries bazı istemcilerde çalışmayabilir

### 10. Önemli Notlar

- E-posta şablonları HTML formatında olmalıdır
- `{{ .ConfirmationURL }}` değişkeni Supabase tarafından otomatik olarak doldurulur
- Template'lerde Türkçe karakter desteği için UTF-8 encoding kullanın
- Logo URL'si mutlaka HTTPS olmalıdır
- E-posta istemcileri CSS desteği sınırlı olduğu için inline CSS tercih edilir
- Dark tema tasarımı tüm modern e-posta istemcilerinde desteklenir

Bu rehberi takip ederek KrediTakip uygulamanız için profesyonel, kurumsal kimliğe uygun e-posta şablonları kurabilirsiniz.
