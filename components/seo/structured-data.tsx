export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://kreditakip.com.tr/#organization",
        name: "Kredi Takip",
        url: "https://kreditakip.com.tr",
        logo: {
          "@type": "ImageObject",
          url: "https://kreditakip.com.tr/logo.png",
          width: 512,
          height: 512,
        },
        description:
          "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi ve yapay zeka destekli finansal yönetim platformu.",
        sameAs: [
          "https://twitter.com/kreditakipcomtr",
          "https://www.linkedin.com/company/kreditakipcomtr",
          "https://www.instagram.com/kreditakip.com.tr",
          "https://www.facebook.com/kreditakip.com.tr",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          email: "info@kreditakip.com.tr",
          areaServed: "TR",
          availableLanguage: ["Turkish"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://kreditakip.com.tr/#website",
        url: "https://kreditakip.com.tr",
        name: "Kredi Takip",
        description:
          "Akıllı kredi yönetimi ve ödeme planlama platformu. OCR teknolojisi ile kredi kartı ekstrenizi dijital ödeme planına dönüştürün.",
        publisher: {
          "@id": "https://kreditakip.com.tr/#organization",
        },
        inLanguage: "tr-TR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://kreditakip.com.tr/?s={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": "https://kreditakip.com.tr/#webpage",
        url: "https://kreditakip.com.tr",
        name: "Kredi Takip - Akıllı Kredi Yönetimi ve Ödeme Planlama",
        isPartOf: {
          "@id": "https://kreditakip.com.tr/#website",
        },
        about: {
          "@id": "https://kreditakip.com.tr/#organization",
        },
        description:
          "Kredi kartı ekstrenizi saniyeler içinde akıllı ödeme planına dönüştürün. OCR teknolojisi, yapay zeka destekli risk analizi ve detaylı finansal raporlama.",
        inLanguage: "tr-TR",
      },
      {
        "@type": "SoftwareApplication",
        name: "Kredi Takip",
        operatingSystem: "Web",
        applicationCategory: "FinanceApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
          description: "Ücretsiz plan ile başlayın, ihtiyacınıza göre premium plana yükseltin",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "1250",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "OCR ile otomatik ekstre okuma",
          "Yapay zeka destekli ödeme planı oluşturma",
          "Çoklu banka desteği",
          "Risk analizi ve finansal öneriler",
          "Detaylı raporlama ve istatistikler",
          "Mobil uyumlu tasarım",
          "Güvenli veri şifreleme",
        ],
        screenshot: "https://kreditakip.com.tr/financial-dashboard.png",
        description:
          "Kredi kartı ve kredi yönetimi için akıllı finansal planlama uygulaması. OCR teknolojisi ile ekstreleri okuyun, yapay zeka ile ödeme planı oluşturun.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Kredi Takip nedir?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Kredi Takip, kredi kartı ekstrelerinizi OCR teknolojisi ile okuyarak otomatik olarak akıllı ödeme planları oluşturan, yapay zeka destekli finansal yönetim platformudur. Kredilerinizi takip edin, risk analizleri yapın ve finansal hedeflerinize ulaşın.",
            },
          },
          {
            "@type": "Question",
            name: "OCR teknolojisi nasıl çalışır?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "OCR (Optik Karakter Tanıma) teknolojisi, kredi kartı ekstre PDF'nizi veya görüntüsünü tarayarak otomatik olarak rakamları, tarihleri ve ödeme bilgilerini çıkarır. Bu sayede manuel veri girişine gerek kalmadan saniyeler içinde dijital ödeme planınız hazır olur.",
            },
          },
          {
            "@type": "Question",
            name: "Ücretsiz plan ile neler yapabilirim?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ücretsiz plan ile aylık 1 adet OCR analizi yapabilir, temel kredi takibi özelliklerinden yararlanabilir ve ödeme planlarınızı yönetebilirsiniz. Premium plan ile sınırsız OCR analizi, gelişmiş risk analizi ve detaylı raporlama özelliklerine erişebilirsiniz.",
            },
          },
          {
            "@type": "Question",
            name: "Verilerim güvende mi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Evet, tüm verileriniz 256-bit SSL şifreleme ile korunur ve güvenli bulut altyapısında saklanır. Kişisel ve finansal bilgileriniz hiçbir şekilde üçüncü kişilerle paylaşılmaz. KVKK ve GDPR uyumlu çalışıyoruz.",
            },
          },
          {
            "@type": "Question",
            name: "Hangi bankaları destekliyorsunuz?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Türkiye'deki tüm büyük bankaların kredi kartı ekstrelerini destekliyoruz. Ziraat Bankası, İş Bankası, Garanti BBVA, Akbank, Yapı Kredi, QNB Finansbank, Denizbank, TEB, ING, ve daha fazlası ile uyumludur.",
            },
          },
        ],
      },
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
