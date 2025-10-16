"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { CheckCircle, X, Star, Crown, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      name: "Ücretsiz",
      price: "0",
      period: "₺",
      description: "Temel özelliklerle başlayın",
      features: [
        "1 adet OCR analizi",
        "Temel kredi takibi",
        "Ödeme hatırlatıcıları",
        "Mobil uygulama erişimi",
        "E-posta bildirimleri",
      ],
      notIncluded: [
        "Risk analizi",
        "Sınırsız OCR analizi",
        "Gelişmiş raporlama",
        "Şifre yönetimi",
        "Reklamsız deneyim",
        "Öncelikli destek",
      ],
      popular: false,
      cta: "Ücretsiz Başla",
      color: "from-gray-500 to-gray-600",
      note: "Reklamlar gösterilir",
    },
    {
      name: "Premium",
      price: "199",
      period: "₺/ay",
      description: "Tüm özelliklere sınırsız erişim",
      features: [
        "Sınırsız OCR analizi",
        "Detaylı risk analizi",
        "Gelişmiş finansal raporlar",
        "PDF rapor indirme",
        "Bankacılık şifre yönetimi",
        "Reklamsız deneyim",
        "Öncelikli destek",
        "Tüm gelecek özellikler",
      ],
      notIncluded: [],
      popular: true,
      cta: "Premium'a Geç",
      color: "from-emerald-500 to-teal-500",
      note: "En popüler seçim",
    },
  ]

  const faqs = [
    {
      question: "Ücretsiz planda kaç analiz yapabilirim?",
      answer:
        "Ücretsiz planda ayda 1 adet OCR destekli kredi dökümü analizi yapabilirsiniz. Daha fazla analiz için Premium plana geçebilirsiniz.",
    },
    {
      question: "Premium üyelik nasıl iptal edilir?",
      answer:
        "Hesap ayarlarınızdan istediğiniz zaman Premium üyeliğinizi iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna kadar Premium özelliklerden yararlanmaya devam edersiniz.",
    },
    {
      question: "Risk analizi nedir?",
      answer:
        "Risk analizi, finansal durumunuzu detaylı olarak değerlendiren ve borç/gelir oranınızı, ödeme kapasitesini analiz eden Premium özelliğimizdir.",
    },
    {
      question: "Ödeme güvenli mi?",
      answer:
        "Evet, tüm ödemeler iyzico güvencesi altında 256-bit SSL şifreleme ile korunur. Kredi kartı bilgileriniz bizimle paylaşılmaz.",
    },
    {
      question: "Ücretsiz kullanıcılar hangi reklamları görür?",
      answer:
        "Ücretsiz kullanıcılar uygulama içinde belirli aralıklarla finansal ürün ve hizmet reklamları görürler. Premium üyeler reklamsız deneyim yaşar.",
    },
    {
      question: "Premium üyelik otomatik yenilenir mi?",
      answer:
        "Evet, Premium üyelik aylık olarak otomatik yenilenir. İstediğiniz zaman iptal edebilir veya yenilemeyi durdurabilirsiniz.",
    },
    {
      question: "Şifre yönetimi özelliği nedir?",
      answer:
        "Premium üyeler, tüm bankacılık şifrelerini güvenli bir şekilde saklayabilir ve yönetebilir. Şifreler 256-bit AES şifreleme ile korunur.",
    },
  ]

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Basit ve Şeffaf Fiyatlandırma</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              İhtiyacınıza Uygun <span className="text-emerald-400">Planı Seçin</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
              Ücretsiz başlayın, ihtiyacınız olduğunda Premium'a geçin. Kredi kartı gerekmez, istediğiniz zaman iptal
              edebilirsiniz.
            </p>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 ${
                    plan.popular ? "ring-2 ring-emerald-500/50 scale-105 md:scale-110" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 border-0">
                        <Star className="mr-2 h-4 w-4" />
                        {plan.note}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-12">
                    <div
                      className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center`}
                    >
                      {index === 0 ? (
                        <Sparkles className="h-10 w-10 text-white" />
                      ) : (
                        <Crown className="h-10 w-10 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-3xl text-white mb-3">{plan.name}</CardTitle>
                    <CardDescription className="text-white/60 text-lg mb-6">{plan.description}</CardDescription>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-xl text-white/70">{plan.period}</span>
                    </div>
                    {!plan.popular && plan.note && (
                      <Badge variant="outline" className="border-white/20 text-white/60">
                        {plan.note}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6 px-8 pb-8">
                    <div className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/80">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3 opacity-40">
                          <X className="h-5 w-5 text-white/40 flex-shrink-0 mt-0.5" />
                          <span className="text-white/40">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          : "bg-white/10 hover:bg-white/20 border border-white/20"
                      } text-white text-lg py-6`}
                      onClick={() => router.push("/giris")}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Özellik Karşılaştırması</h2>
              <p className="text-xl text-white/70">Hangi planın size uygun olduğunu görün</p>
            </div>

            <div className="max-w-4xl mx-auto bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-6 px-8 text-white font-semibold text-lg">Özellikler</th>
                      <th className="text-center py-6 px-8 text-white font-semibold text-lg">Ücretsiz</th>
                      <th className="text-center py-6 px-8 text-white font-semibold text-lg">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {[
                      ["OCR Analizi", "1/ay", "Sınırsız"],
                      ["Risk Analizi", "❌", "✅"],
                      ["Gelişmiş Raporlar", "❌", "✅"],
                      ["PDF Rapor İndirme", "❌", "✅"],
                      ["Şifre Yönetimi", "❌", "✅"],
                      ["Reklamsız Deneyim", "❌", "✅"],
                      ["Öncelikli Destek", "❌", "✅"],
                      ["Tüm Gelecek Özellikler", "❌", "✅"],
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-5 px-8 font-medium">{row[0]}</td>
                        <td className="py-5 px-8 text-center">{row[1]}</td>
                        <td className="py-5 px-8 text-center text-emerald-400 font-medium">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Sıkça Sorulan Sorular</h2>
              <p className="text-xl text-white/70">Merak ettiğiniz her şey burada</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all"
                >
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-black/20 border border-white/10 rounded-3xl p-12 md:p-16 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Hemen <span className="text-emerald-400">Başlayın</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Ücretsiz hesap oluşturun ve kredi yönetiminizi bir sonraki seviyeye taşıyın
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg"
                    onClick={() => router.push("/giris")}
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Ücretsiz Başla
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    onClick={() => router.push("/iletisim")}
                  >
                    Daha Fazla Bilgi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
