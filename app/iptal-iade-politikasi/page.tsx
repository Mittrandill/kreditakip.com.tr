import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Calendar, CreditCard, RefreshCw, X, ArrowRight, Zap, Shield } from "lucide-react"
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

              {/* Section 1: 14 Günlük İade Hakkı */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                  1. 14 Günlük İade Hakkı (Cayma Hakkı)
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Kullanıcılarımız, satın alma tarihinden itibaren 14 gün içinde herhangi bir gerekçe göstermeden iade talep etmeye hak kazanır.
                  </p>

                  <p className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    Bu iade politikası, ödeme altyapımız Paddle'ın zorunlu 14 günlük refund policy gerekliliği doğrultusunda uygulanmaktadır.
                  </p>

                  <p>
                    14 günlük süre içinde yapılan tüm iade talepleri, koşulsuz olarak işleme alınır.
                  </p>
                </div>
              </div>

              {/* Section 2: İade Süreci */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                  2. İade Süreci Nasıl İşler?
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    İade talepleri, ödemenin gerçekleştiği platform olan Paddle üzerinden işlenir ve ödemenin yapıldığı yöntemle kullanıcının hesabına iade edilir.
                  </p>

                  <p><strong>İade süreci şu adımlarla ilerler:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Kullanıcı iade talebini iletir</li>
                    <li>Talep Paddle tarafından doğrulanır</li>
                    <li>İade, ödeme yöntemine bağlı olarak genellikle 3–10 iş günü içinde tamamlanır</li>
                  </ul>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                    <p><strong>İade talepleri için:</strong></p>
                    <p className="mt-2">
                      📩 <a href="mailto:sellers@paddle.com" className="text-emerald-400 hover:underline">sellers@paddle.com</a>
                    </p>
                    <p className="mt-1">
                      veya
                    </p>
                    <p className="mt-1">
                      📩 <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">info@kreditakip.com.tr</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: 14 Günlük Süre Sonrası */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-emerald-400" />
                  3. 14 Günlük Süre Sonrası İade Talepleri
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    14 günlük yasal/policy süresi dolduktan sonra yapılan iade talepleri Paddle tarafından kabul edilmemektedir.
                  </p>

                  <p>
                    Ancak ürünle ilgili bir teknik sorun yaşanması durumunda, destek ekibimiz çözüm üretmek için kullanıcılarımızla birebir çalışacaktır.
                  </p>
                </div>
              </div>

              {/* Section 4: Abonelik İptalleri */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <X className="w-6 h-6 text-emerald-400" />
                  4. Abonelik İptalleri
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Kredi Takip aboneliğinizi dilediğiniz zaman iptal edebilirsiniz.
                  </p>

                  <p><strong>İptal işlemi sonrasında:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Mevcut fatura döneminin sonuna kadar hizmetlerden yararlanmaya devam edersiniz</li>
                    <li>İptal işlemi ileriye dönük geçerlidir; geçmiş dönemlere ilişkin iadeler Paddle politikaları gereği yapılamamaktadır</li>
                  </ul>
                </div>
              </div>

              {/* Section 5: Dijital Hizmet Niteliği */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-emerald-400" />
                  5. Dijital Hizmet Niteliği
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    Kredi Takip tamamen dijital bir ürün olduğundan, üyelik aktivasyonuyla birlikte hizmete anında erişim sağlanır.
                  </p>

                  <p className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    Buna rağmen Paddle'ın global policy'si gereği, dijital ürünlerde dahi 14 günlük koşulsuz iade hakkı sunulmaktadır.
                  </p>
                </div>
              </div>

              {/* Section 6: Haksız Kullanım */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  6. Haksız Kullanım / Kötüniyetli İade Talepleri
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    Nadir durumlarda, sistemin kötüye kullanıldığı tespit edilirse Paddle ek doğrulamalar isteyebilir.
                  </p>

                  <p>
                    Bu tür durumlarda Kredi Takip, kullanıcı hesabını inceleme altına alma veya askıya alma hakkını saklı tutar.
                  </p>
                </div>
              </div>

              {/* Section 7: İletişim */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  7. İletişim
                </h2>
                <div className="text-white/80 leading-relaxed space-y-3">
                  <p>
                    İptal ve iade süreçleriyle ilgili tüm sorular için bizimle iletişime geçebilirsiniz:
                  </p>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                    <p>
                      📩 <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline font-semibold">info@kreditakip.com.tr</a>
                    </p>
                    <p>
                      🌐 <a href="https://kreditakip.com.tr" className="text-emerald-400 hover:underline font-semibold">kreditakip.com.tr</a>
                    </p>
                  </div>
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
                  <h3 className="text-lg font-bold text-white mb-3">Yardım & Destek</h3>
                  <p className="text-white/70 text-sm mb-4">Yardım ve destek alın</p>
                  <a href="mailto:info@kreditakip.com.tr">
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