"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { CheckCircle, X, Star, Crown, Sparkles, ArrowRight, Zap, Phone, MessageCircle } from "lucide-react"
import { useState } from "react"

const CONTACT_PHONE = "+90 543 203 53 09"
const CONTACT_PHONE_CLEAN = "905432035309"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      id: "free",
      priceId: null,
      name: "Ücretsiz",
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: "₺",
      description: "Temel özelliklerle başlayın",
      features: ["1 adet OCR analizi", "Temel kredi takibi", "Ödeme hatırlatıcıları"],
      notIncluded: [
        "Finansal sağlık analizi",
        "Gelişmiş raporlama",
        "Reklamsız deneyim",
        "Öncelikli destek",
      ],
      popular: false,
      cta: "Ücretsiz Başla",
      color: "from-gray-500 to-gray-600",
      note: "Reklamlar gösterilir",
    },
    {
      id: billingPeriod === "monthly" ? "pro-monthly" : "pro-yearly",
      priceId: billingPeriod === "monthly" ? "pri_01kb7r1c749c5ec0demkv56g05" : "pri_01kb7r89wqyhvvzzejybd9meb6",
      name: "Pro",
      monthlyPrice: 199,
      yearlyPrice: 1910,
      originalYearlyPrice: 2388,
      period: billingPeriod === "monthly" ? "₺/ay" : "₺/yıl",
      description: "Profesyonel kullanım için",
      features: [
        "10 adet OCR analizi/ay",
        "5 adet AI Finansal Sağlık Analizi/ay",
        "Gelişmiş finansal raporlar",
        "Reklamsız deneyim",
        "Öncelikli destek",
      ],
      notIncluded: [
        "Sınırsız OCR analizi",
        "Sınırsız AI analizi",
        "Premium badge",
      ],
      popular: false,
      cta: "Pro'ya Geç",
      color: "from-blue-500 to-indigo-500",
      note: "İşletmeler için ideal",
      savings: billingPeriod === "yearly" ? "478₺ tasarruf" : undefined,
      discount: billingPeriod === "yearly" ? "%20 İndirim" : undefined,
    },
    {
      id: billingPeriod === "monthly" ? "premium-monthly" : "premium-yearly",
      priceId: billingPeriod === "monthly" ? "pri_01kb7rb4ax73c91kg41dzascmd" : "pri_01kb7rczq5dj86fcq63941dn2m",
      name: "Premium",
      monthlyPrice: 399,
      yearlyPrice: 3830,
      originalYearlyPrice: 4788,
      period: billingPeriod === "monthly" ? "₺/ay" : "₺/yıl",
      description: "Tüm özelliklere sınırsız erişim",
      features: [
        "Sınırsız OCR analizi",
        "Sınırsız AI Finansal Sağlık Analizi",
        "Gelişmiş finansal raporlar",
        "PDF rapor indirme",
        "Reklamsız deneyim",
        "Öncelikli destek",
        "Premium badge",
        "Tüm gelecek özellikler",
      ],
      notIncluded: [],
      popular: true,
      cta: "Premium'a Geç",
      color: "from-emerald-500 to-teal-500",
      note: "En popüler seçim",
      savings: billingPeriod === "yearly" ? "958₺ tasarruf" : undefined,
      discount: billingPeriod === "yearly" ? "%20 İndirim" : undefined,
    },
  ]

  const faqs = [
    {
      question: "Ücretsiz planda kaç analiz yapabilirim?",
      answer:
        "Ücretsiz planda ayda 1 adet OCR destekli kredi dökümü analizi yapabilirsiniz. Daha fazla analiz için Pro veya Premium plana geçebilirsiniz.",
    },
    {
      question: "Pro ve Premium arasındaki fark nedir?",
      answer:
        "Pro plan aylık 10 OCR ve 5 AI analiz limiti ile profesyonel kullanım için uygundur. Premium plan sınırsız OCR ve AI analiz sunar, tüm gelecek özelliklere erişim sağlar.",
    },
    {
      question: "Abonelik nasıl satın alınır?",
      answer:
        "+90 543 203 53 09 numaralı telefonu arayarak veya WhatsApp üzerinden yazarak kolayca abonelik satın alabilirsiniz. Ekibimiz size en uygun planı belirleyerek aktivasyonu gerçekleştirir.",
    },
    {
      question: "Finansal sağlık analizi nedir?",
      answer:
        "Finansal sağlık analizi, AI ile finansal durumunuzu detaylı olarak değerlendiren, borç/gelir oranınızı ve ödeme kapasitesini analiz eden premium özelliğimizdir.",
    },
    {
      question: "Abonelik için nasıl iletişime geçebilirim?",
      answer:
        "+90 543 203 53 09 numaralı telefonu arayabilir veya WhatsApp üzerinden mesaj gönderebilirsiniz. Çalışma saatlerimiz içinde size en kısa sürede dönüş yapılır.",
    },
    {
      question: "Yıllık planlarda indirim var mı?",
      answer:
        "Evet! Yıllık planlarda %20 indirim sunuyoruz. Pro için 478₺, Premium için 958₺ tasarruf edersiniz.",
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
              Ücretsiz başlayın, ihtiyacınız olduğunda Pro veya Premium'a geçin. Kredi kartı gerekmez, istediğiniz zaman iptal
              edebilirsiniz.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-lg ${billingPeriod === "monthly" ? "text-white font-semibold" : "text-white/60"}`}>
                Aylık
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className="relative w-16 h-8 bg-white/10 rounded-full border border-white/20 transition-all hover:bg-white/20"
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all ${
                    billingPeriod === "yearly" ? "left-9" : "left-1"
                  }`}
                />
              </button>
              <span className={`text-lg ${billingPeriod === "yearly" ? "text-white font-semibold" : "text-white/60"}`}>
                Yıllık
              </span>
              {billingPeriod === "yearly" && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">%20 İndirim</Badge>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 ${
                    plan.popular ? "ring-2 ring-emerald-500/50 md:scale-105" : ""
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
                      ) : index === 1 ? (
                        <Zap className="h-10 w-10 text-white" />
                      ) : (
                        <Crown className="h-10 w-10 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-3xl text-white mb-3">{plan.name}</CardTitle>
                    <CardDescription className="text-white/60 text-lg mb-6">{plan.description}</CardDescription>
                    <div className="mb-6">
                      {billingPeriod === "yearly" && plan.originalYearlyPrice && (
                        <div className="text-lg text-white/40 line-through mb-1">
                          ₺{plan.originalYearlyPrice.toLocaleString('tr-TR')}
                        </div>
                      )}
                      <div>
                        <span className="text-5xl font-bold text-white">
                          {billingPeriod === "monthly"
                            ? plan.monthlyPrice.toLocaleString('tr-TR')
                            : plan.yearlyPrice.toLocaleString('tr-TR')
                          }
                        </span>
                        <span className="text-xl text-white/70">{plan.period}</span>
                      </div>
                      {billingPeriod === "yearly" && plan.savings && (
                        <div className="mt-2">
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                            {plan.savings}
                          </Badge>
                        </div>
                      )}
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

                    {plan.id === "free" ? (
                      <a
                        href="/kayit-ol"
                        className="flex items-center justify-center w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg py-4 rounded-md transition-colors"
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    ) : (
                      <div className="space-y-3">
                        <a
                          href={`tel:${CONTACT_PHONE_CLEAN}`}
                          className={`flex items-center justify-center gap-2 w-full text-white text-base py-4 rounded-md transition-colors ${
                            plan.popular
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                          }`}
                        >
                          <Phone className="h-5 w-5" />
                          {CONTACT_PHONE}
                        </a>
                        <a
                          href={`https://wa.me/${CONTACT_PHONE_CLEAN}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm py-3 rounded-md transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp ile yazın
                        </a>
                      </div>
                    )}
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

            <div className="max-w-6xl mx-auto bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-6 px-8 text-white font-semibold text-lg">Özellikler</th>
                      <th className="text-center py-6 px-4 text-white font-semibold text-lg">Ücretsiz</th>
                      <th className="text-center py-6 px-4 text-white font-semibold text-lg">Pro</th>
                      <th className="text-center py-6 px-4 text-white font-semibold text-lg">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {[
                      ["OCR Analizi", "1/ay", "10/ay", "Sınırsız"],
                      ["AI Finansal Sağlık Analizi", "❌", "5/ay", "Sınırsız"],
                      ["Gelişmiş Raporlar", "❌", "✅", "✅"],
                      ["PDF Rapor İndirme", "❌", "❌", "✅"],
                      ["Reklamsız Deneyim", "❌", "✅", "✅"],
                      ["Öncelikli Destek", "❌", "✅", "✅"],
                      ["Premium Badge", "❌", "❌", "✅"],
                      ["Tüm Gelecek Özellikler", "❌", "❌", "✅"],
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-5 px-8 font-medium">{row[0]}</td>
                        <td className="py-5 px-4 text-center">{row[1]}</td>
                        <td className="py-5 px-4 text-center text-blue-400 font-medium">{row[2]}</td>
                        <td className="py-5 px-4 text-center text-emerald-400 font-medium">{row[3]}</td>
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
                  Ücretsiz başlayın veya Pro/Premium için bizimle iletişime geçin
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/kayit-ol"
                    className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 text-lg rounded-md transition-colors"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Ücretsiz Başla
                  </a>
                  <a
                    href="tel:905432035309"
                    className="inline-flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-md transition-colors"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    +90 543 203 53 09
                  </a>
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
