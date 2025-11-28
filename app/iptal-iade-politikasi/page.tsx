import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Calendar, CreditCard, RefreshCw, X, ArrowRight } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function CancellationRefundPolicyPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
                <AlertTriangle className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-medium">İptal ve İade Politikası</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Abonelik <span className="text-emerald-400">İptali</span> ve İade
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Kredi Takip abonelikleriniz için iptal ve iade koşulları.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Yürürlük Tarihi: 28 Kasım 2024</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 md:p-12">

              {/* Section 1: Abonelik İptali */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <X className="w-6 h-6 text-emerald-400" />
                  1. Abonelik İptali
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <strong className="text-emerald-200">Herhangi bir Zaman İptal Hakkı:</strong> Kredi Takip aboneliğinizi
                    istediğiniz zaman, herhangi bir ceza ödemeden iptal edebilirsiniz. İptal işlemi sonrasında, ödenmiş olan
                    mevcut abonelik döneminizin sonuna kadar Premium özelliklere erişiminiz devam eder.
                  </p>

                  <p><strong>İptal Yöntemleri:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Paddle müşteri portalı üzerinden otomatik iptal</li>
                    <li>Hesap ayarlarınızdan abonelik yönetimi</li>
                    <li>E-posta yoluyla destek talebi (<a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">info@kreditakip.com.tr</a>)</li>
                  </ul>

                  <p><strong>İptal Süreci:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>İptal talebi aldığında anında işleme alınır</li>
                    <li>İptal onayı e-posta ile bildirilir</li>
                    <li>Mevcut abonelik döneminizin bitiş tarihi belirtilir</li>
                    <li>Dönem sonunda otomatik olarak ücretsiz plana geçiş yapılır</li>
                  </ul>
                </div>
              </div>

              {/* Section 2: İade Politikası */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                  2. İade Politikası
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <strong className="text-yellow-200">Kullanılmış Hizmetler İade Edilmez:</strong> Kredi Takip'te
                    kullanılmış hizmetler için iade yapılmaz. Örneğin, analiz edilen kredi dökümanları veya kullanılan AI
                    özellikleri için iade talep edilemez.
                  </p>

                  <p><strong>İade Koşulları:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>İlk Satın Alma İade Hakkı:</strong> İlk aboneliğiniz için 14 gün içinde iade talep edebilirsiniz. Hizmeti kullanmadığınızı kanıtlamanız gerekir.</li>
                    <li><strong>Yıllık Abonelikler:</strong> Sadece yıllık abonelikler için belirli koşullarda pro-rata iade mümkündür</li>
                    <li><strong>İade Talebi:</strong> İade talebiniz <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">info@kreditakip.com.tr</a> adresine gönderilmelidir</li>
                    <li><strong>İşlem Süresi:</strong> İade talepleri en geç 14 iş günü içinde sonuçlandırılır</li>
                    <li><strong>Chargeback:</strong> Chargeback talepleri Paddle politikasına göre işlenir</li>
                  </ul>

                  <p><strong>İade Süreci:</strong></p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>İade talebi <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">info@kreditakip.com.tr</a> adresine bildirilir</li>
                    <li>Talebiniz en geç 7 iş günü içinde değerlendirilir</li>
                    <li>Onaylanan iadeler Paddle üzerinden işlenir</li>
                    <li>İade, orijinal ödeme yöntemine yapılır</li>
                    <li>Banka işlemlerine bağlı olarak iade 5-10 iş günü sürebilir</li>
                  </ol>
                </div>
              </div>

              {/* Section 3: Özel Durumlar */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-emerald-400" />
                  3. Özel Durumlar
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p><strong>Teknik Sorunlar:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Kredi Takip hizmetinde 48 saatten uzun süren kesinti durumunda</li>
                    <li>Analiz sonuçlarının sistematik olarak yanlış çıkması durumunda</li>
                    <li>Veri güvenliği ihlali veya gizlilik sorunu yaşanması halinde</li>
                  </ul>

                  <p><strong>Haksız İptal/İade Talepleri:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Aylık aboneliklerde iade yapılmaz</li>
                    <li>Kısmi kullanım durumlarında iade oranı düşürülebilir</li>
                    <li>Kötüye kullanım veya politikayı ihlal durumunda iptal/iade yapılmaz</li>
                  </ul>
                </div>
              </div>

              {/* Section 4: Ödeme Güvenliği ve Otomatik Yenileme */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  4. Ödeme Güvenliği ve Otomatik Yenileme
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p><strong>3D Secure Güvenliği:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>İlk ödemede 3D Secure kart doğrulaması yapılır</li>
                    <li>Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz</li>
                    <li>Tüm ödemeler Paddle'ın PCI-DSS Level 1 sertifikalı altyapısında güvende</li>
                  </ul>

                  <p><strong>Otomatik Yenileme:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Otomatik yenileme açık kullanıcı onayı ile yapılır</li>
                    <li>Abonelik yenileme tarihinden önce e-posta ile bilgilendirme yapılır</li>
                    <li>İstediğiniz zaman aboneliğinizi iptal edebilirsiniz</li>
                    <li>İptal ettiğinizde mevcut dönem sonuna kadar erişim devam eder</li>
                  </ul>
                </div>
              </div>

              {/* Section 5: Paddle Rollü */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  5. Paddle'ın Rolü
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p>
                    <strong className="text-blue-200">Ödeme İşlemleri ve İadeler:</strong> Tüm ödeme işlemleri ve iadeler,
                    resmi ödeme sağlayıcımız olan Paddle tarafından yönetilir. Paddle, Merchant of Record olarak hareket eder
                    ve tüm finansal işlemlerden yasal olarak sorumludur.
                  </p>

                  <ul className="list-disc pl-6 space-y-2">
                    <li>İade talepleri Paddle politikalarına göre işlenir</li>
                    <li>Chargeback (geri itiraz) işlemleri Paddle tarafından yönetilir</li>
                    <li>Ödeme güvenliği ve dolandırıcılık koruması Paddle tarafından sağlanır</li>
                    <li>Vergi ve yasal uyumluluk Paddle tarafından yönetilir</li>
                    <li>Finansal dispute (anlaşmazlık) durumları Paddle support tarafından çözülür</li>
                  </ul>

                  <p className="text-sm">
                    <strong>Destek:</strong> Paddle ile ilgili sorularınız için
                    <a href="https://paddle.com/support/" target="_blank" className="text-emerald-400 hover:underline ml-1">
                      Paddle Support
                    </a>
                    sayfasını ziyaret edebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Section 5: İletişim */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">İletişim Bilgileri</h3>
                <div className="text-white/80 space-y-3">
                  <p>
                    <strong>İptal ve İade Talepleri için:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      E-posta:{" "}
                      <a href="mailto:destek@kreditakip.com.tr" className="text-emerald-400 hover:underline">
                        destek@kreditakip.com.tr
                      </a>
                    </li>
                    <li>
                      Telefon:{" "}
                      <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
                        0 543 203 53 09
                      </a>
                    </li>
                    <li>
                      Çalışma Saatleri: Pazartesi - Cuma, 09:00 - 18:00
                    </li>
                  </ul>

                  <p className="text-sm text-white/60 mt-4">
                    Taleplerinize en geç 24 saat içinde dönüş yapmayı hedefliyoruz. İade talepleri
                    karmaşık olabileceğinden, işleyiş süresi 14 iş gününü bulabilir.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-8 bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Önemli Bilgilendirme
              </h3>
              <p className="text-white/80 leading-relaxed">
                Bu politika, Kredi Takip ve Paddle arasındaki resmi anlaşmaya dayanır. Politika değişiklikleri,
                kullanıcılarımıza e-posta ve uygulama içi bildirimler ile duyurulur. Devam eden abonelikler,
                değişikliklerden önceki şartlara tabidir. Politikamız KVKK, GDPR ve ilgili tüm yerel yasalara
                uygundur.
              </p>
            </div>

            {/* Related Links */}
            <div className="mt-12 grid md:grid-cols-4 gap-6">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Kullanım Şartları</h3>
                  <p className="text-white/70 text-sm mb-4">Uygulama kullanım kuralları</p>
                  <Link href="/kullanim-sartlari">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Gizlilik Politikası</h3>
                  <p className="text-white/70 text-sm mb-4">Veri güvenliği ve gizlilik</p>
                  <Link href="/gizlilik-politikasi">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      İncele <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Abonelik Yönetimi</h3>
                  <p className="text-white/70 text-sm mb-4">Aboneliğinizi yönetin</p>
                  <Link href="/uygulama/abonelik">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      Git <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Destek</h3>
                  <p className="text-white/70 text-sm mb-4">Yardım ve destek alın</p>
                  <a href="mailto:destek@kreditakip.com.tr">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      İletişime Geç <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}