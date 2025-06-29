"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import {
  ArrowRight,
  Scan,
  Brain,
  BarChart3,
  Shield,
  CheckCircle,
  Zap,
  Clock,
  Users,
  CreditCard,
  TrendingUp,
  Bell,
  Smartphone,
  Globe,
  Lock,
  Download,
  RefreshCw,
  Target,
  Sparkles,
  Star,
  Headphones,
  Database,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function FeaturesPage() {
  const router = useRouter()

  const mainFeatures = [
    {
      icon: Scan,
      title: "OCR Teknolojisi",
      description: "PDF ödeme planlarınızı saniyeler içinde analiz edin. Tüm banka formatları desteklenir.",
      color: "from-emerald-500 to-teal-500",
      features: [
        "99.9% doğruluk oranı",
        "Tüm banka formatları",
        "Otomatik veri çıkarma",
        "Manuel giriş yok",
        "Hata oranı %0.1",
        "Saniyeler içinde analiz",
      ],
      image: "/placeholder.svg?height=400&width=600&text=OCR+Technology",
    },
    {
      icon: Brain,
      title: "Yapay Zeka Analizi",
      description: "AI destekli risk analizi ve refinansman önerileri ile tasarruf edin.",
      color: "from-purple-500 to-pink-500",
      features: [
        "Kişisel öneriler",
        "Risk skorlama",
        "Otomatik uyarılar",
        "Trend analizi",
        "Tahmine dayalı modelleme",
        "Ortalama %30 tasarruf",
      ],
      image: "/placeholder.svg?height=400&width=600&text=AI+Analysis",
    },
    {
      icon: BarChart3,
      title: "Gelişmiş Raporlama",
      description: "Detaylı grafikler ve analizlerle kredi durumunuzu görselleştirin.",
      color: "from-blue-500 to-cyan-500",
      features: [
        "İnteraktif grafikler",
        "PDF/Excel export",
        "Özelleştirilebilir",
        "Gerçek zamanlı",
        "Karşılaştırmalı analiz",
        "Mobil uyumlu",
      ],
      image: "/placeholder.svg?height=400&width=600&text=Advanced+Reports",
    },
    {
      icon: Shield,
      title: "Banka Seviyesi Güvenlik",
      description: "256-bit şifreleme ile verileriniz maksimum güvenlik altında.",
      color: "from-orange-500 to-red-500",
      features: [
        "End-to-end şifreleme",
        "SOC 2 Type II sertifikalı",
        "KVKK uyumlu",
        "ISO 27001",
        "Güvenlik denetimleri",
        "7/24 izleme",
      ],
      image: "/placeholder.svg?height=400&width=600&text=Bank+Level+Security",
    },
  ]

  const additionalFeatures = [
    {
      icon: Bell,
      title: "Akıllı Bildirimler",
      description: "Ödeme tarihleri, faiz değişiklikleri ve fırsatlar için otomatik uyarılar",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Smartphone,
      title: "Mobil Uygulama",
      description: "iOS ve Android uygulamaları ile her yerden erişim",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Globe,
      title: "Çoklu Dil Desteği",
      description: "Türkçe, İngilizce ve diğer dillerde kullanım",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Lock,
      title: "İki Faktörlü Doğrulama",
      description: "Hesabınız için ekstra güvenlik katmanı",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Download,
      title: "Toplu Veri İndirme",
      description: "Tüm verilerinizi tek seferde indirin",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: RefreshCw,
      title: "Otomatik Senkronizasyon",
      description: "Banka hesaplarınızla otomatik senkronizasyon",
      color: "from-teal-500 to-green-500",
    },
    {
      icon: Target,
      title: "Hedef Takibi",
      description: "Finansal hedeflerinizi belirleyin ve takip edin",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Users,
      title: "Ekip Yönetimi",
      description: "Şirketler için çoklu kullanıcı desteği",
      color: "from-orange-500 to-yellow-500",
    },
    {
      icon: Database,
      title: "Veri Yedekleme",
      description: "Otomatik bulut yedekleme ve geri yükleme",
      color: "from-emerald-500 to-teal-500",
    },
  ]

  const integrations = [
    { name: "Ziraat Bankası", logo: "/images/banks/ziraat-logo.png" },
    { name: "İş Bankası", logo: "/images/banks/isbank-logo.png" },
    { name: "Garanti BBVA", logo: "/images/banks/garanti-logo.png" },
    { name: "Akbank", logo: "/images/banks/akbank-logo.png" },
    { name: "Yapı Kredi", logo: "/images/banks/yapikredi-logo.png" },
    { name: "Halkbank", logo: "/images/banks/halkbank-logo.png" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-8 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-6 py-3">
              <Sparkles className="mr-2 h-5 w-5" />
              Premium Özellikler
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="block text-white">Kredi Yönetiminde</span>
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Yeni Nesil Teknoloji
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Finansal geleceğinizi güvence altına alacak gelişmiş araçlar ve analizler. OCR teknolojisi, yapay zeka ve
              banka seviyesi güvenlik bir arada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/giris")}
              >
                <Zap className="mr-2 h-5 w-5" />
                Ücretsiz Deneyin
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500 text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/iletisim")}
              >
                <Headphones className="mr-2 h-5 w-5" />
                Demo Talep Et
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="space-y-32">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl shadow-lg`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Premium</Badge>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{feature.title}</h3>

                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">{feature.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {feature.features.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-400">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    onClick={() => router.push("/giris")}
                  >
                    Özelliği Deneyin
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Image */}
                <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl" />
                    <img
                      src={feature.image || "/placeholder.svg"}
                      alt={feature.title}
                      className="relative rounded-3xl shadow-2xl border border-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Daha Fazla Güçlü Özellik</h2>
            <p className="text-xl text-gray-300">Kredi yönetimini kolaylaştıran ek araçlar ve özellikler</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <Card
                key={index}
                className="group bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all duration-300"
              >
                <CardHeader>
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bank Integrations */}
      <section className="py-20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Desteklenen Bankalar</h2>
            <p className="text-xl text-gray-300">Türkiye'nin önde gelen bankaları ile entegrasyon</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {integrations.map((bank, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
              >
                <img
                  src={bank.logo || "/placeholder.svg"}
                  alt={bank.name}
                  className="w-full h-12 object-contain filter brightness-75 group-hover:brightness-100 transition-all duration-300"
                />
                <p className="text-center text-sm text-gray-400 mt-3 group-hover:text-gray-300 transition-colors">
                  {bank.name}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Ve daha fazlası...</p>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500"
            >
              Tüm Entegrasyonları Görün
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, value: "25,000+", label: "Aktif Kullanıcı" },
              { icon: CreditCard, value: "100,000+", label: "Analiz Edilen Kredi" },
              { icon: TrendingUp, value: "₺2.5M+", label: "Toplam Tasarruf" },
              { icon: Star, value: "4.9/5", label: "Kullanıcı Puanı" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Tüm Bu Özellikleri
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Ücretsiz Deneyin
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              14 gün boyunca tüm premium özelliklere ücretsiz erişim. Kredi kartı gerekmez, istediğiniz zaman iptal
              edebilirsiniz.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/giris")}
              >
                <Zap className="mr-2 h-5 w-5" />
                14 Gün Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500 text-lg px-8 py-4 h-auto"
                onClick={() => router.push("/fiyatlandirma")}
              >
                Fiyatları İncele
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Kredi kartı gerekmez
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                30 gün para iade garantisi
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Anında kurulum
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
