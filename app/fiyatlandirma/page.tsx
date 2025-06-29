"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { CheckCircle, X, Star, Zap, Crown, Rocket, Headphones, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      name: "Başlangıç",
      price: "0",
      period: "Ücretsiz",
      description: "Bireysel kullanıcılar için temel özellikler",
      features: ["5 PDF analizi/ay", "Temel raporlama", "E-posta desteği", "Mobil uygulama", "Temel güvenlik"],
      notIncluded: [
        "AI destekli öneriler",
        "Gelişmiş raporlama",
        "API erişimi",
        "Öncelikli destek",
        "Özel entegrasyonlar",
      ],
      popular: false,
      cta: "Ücretsiz Başla",
      color: "from-gray-500 to-gray-600",
    },
    {
      name: "Profesyonel",
      price: "299",
      period: "/ay",
      description: "Küçük işletmeler ve profesyoneller için",
      features: [
        "Sınırsız PDF analizi",
        "AI destekli öneriler",
        "Gelişmiş raporlama",
        "Öncelikli e-posta desteği",
        "API erişimi",
        "Özel dashboard",
        "Excel/PDF export",
        "Mobil uygulama",
      ],
      notIncluded: ["Telefon desteği", "Özel entegrasyonlar", "Dedicated hesap yöneticisi"],
      popular: true,
      cta: "14 Gün Ücretsiz Dene",
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Kurumsal",
      price: "999",
      period: "/ay",
      description: "Büyük şirketler için gelişmiş çözümler",
      features: [
        "Sınırsız her şey",
        "Gelişmiş AI analizi",
        "Özel raporlama",
        "7/24 telefon desteği",
        "Özel entegrasyonlar",
        "Dedicated hesap yöneticisi",
        "SLA garantisi",
        "Özel eğitim",
        "Beyaz etiket çözümü",
        "On-premise kurulum",
      ],
      notIncluded: [],
      popular: false,
      cta: "Satış Ekibiyle Görüş",
      color: "from-purple-500 to-pink-500",
    },
  ]

  const faqs = [
    {
      question: "Ücretsiz deneme süresi boyunca kredi kartı bilgisi gerekli mi?",
      answer:
        "Hayır, 14 günlük ücretsiz deneme için kredi kartı bilgisi gerekmez. Deneme süresi sonunda otomatik ücretlendirme yapılmaz.",
    },
    {
      question: "Plan değişikliği nasıl yapılır?",
      answer:
        "Hesap ayarlarınızdan istediğiniz zaman plan değişikliği yapabilirsiniz. Yükseltme anında aktif olur, düşürme ise bir sonraki fatura döneminde geçerli olur.",
    },
    {
      question: "Para iade garantisi var mı?",
      answer:
        "Evet, tüm ücretli planlar için 30 gün para iade garantisi sunuyoruz. Memnun kalmazsanız tam iade alabilirsiniz.",
    },
    {
      question: "Kurumsal planlar için özel fiyatlandırma var mı?",
      answer:
        "Evet, 100+ kullanıcı için özel fiyatlandırma seçeneklerimiz bulunmaktadır. Satış ekibimizle iletişime geçin.",
    },
    {
      question: "Verilerim güvende mi?",
      answer:
        "Evet, tüm verileriniz 256-bit SSL şifreleme ile korunur. SOC 2 Type II sertifikalıyız ve KVKK uyumlu çalışırız.",
    },
    {
      question: "API kullanımı nasıl faturalandırılır?",
      answer:
        "API kullanımı planınıza dahildir. Profesyonel planda aylık 10,000 çağrı, Kurumsal planda sınırsız kullanım mevcuttur.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-6 py-2">
              <Crown className="mr-2 h-5 w-5" />
              Şeffaf Fiyatlandırma
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              İhtiyacınıza Uygun{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Planı Seçin
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              14 gün ücretsiz deneme ile başlayın. Kredi kartı gerekmez. İstediğiniz zaman iptal edebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-all duration-300 ${
                  plan.popular ? "ring-2 ring-emerald-500/50 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2">
                      <Star className="mr-2 h-4 w-4" />
                      En Popüler
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center`}
                  >
                    {index === 0 && <Zap className="h-8 w-8 text-white" />}
                    {index === 1 && <Rocket className="h-8 w-8 text-white" />}
                    {index === 2 && <Crown className="h-8 w-8 text-white" />}
                  </div>
                  <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400 mb-6">{plan.description}</CardDescription>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">₺{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3 opacity-50">
                        <X className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    } text-white`}
                    onClick={() => router.push("/giris")}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Özellik Karşılaştırması</h2>
            <p className="text-gray-300">Hangi planın size uygun olduğunu görün</p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-white font-semibold">Özellikler</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Başlangıç</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Profesyonel</th>
                  <th className="text-center py-4 px-6 text-white font-semibold">Kurumsal</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {[
                  ["PDF Analizi", "5/ay", "Sınırsız", "Sınırsız"],
                  ["AI Destekli Öneriler", "❌", "✅", "✅"],
                  ["Gelişmiş Raporlama", "❌", "✅", "✅"],
                  ["API Erişimi", "❌", "✅", "✅"],
                  ["Telefon Desteği", "❌", "❌", "✅"],
                  ["Özel Entegrasyonlar", "❌", "❌", "✅"],
                  ["SLA Garantisi", "❌", "❌", "✅"],
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-4 px-6 font-medium">{row[0]}</td>
                    <td className="py-4 px-6 text-center">{row[1]}</td>
                    <td className="py-4 px-6 text-center">{row[2]}</td>
                    <td className="py-4 px-6 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-gray-300">Merak ettiğiniz her şey burada</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600/20 to-teal-600/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Hala Karar Veremediniz Mi?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Uzmanlarımızla konuşun ve size en uygun planı birlikte belirleyin
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                onClick={() => router.push("/giris")}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Ücretsiz Deneme Başlat
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500"
                onClick={() => router.push("/iletisim")}
              >
                <Headphones className="mr-2 h-5 w-5" />
                Satış Ekibiyle Görüş
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
