"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import {
  Users,
  Target,
  Award,
  Rocket,
  Shield,
  Heart,
  Lightbulb,
  Globe,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()

  const values = [
    {
      icon: Shield,
      title: "Güvenlik",
      description: "Müşterilerimizin verilerini en üst düzeyde koruyoruz",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Lightbulb,
      title: "İnovasyon",
      description: "Sürekli gelişim ve yenilikçi çözümlerle öncü olmaya devam ediyoruz",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Heart,
      title: "Müşteri Odaklılık",
      description: "Her kararımızda müşteri memnuniyetini ön planda tutuyoruz",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Target,
      title: "Şeffaflık",
      description: "Açık ve dürüst iletişimle güven inşa ediyoruz",
      color: "from-orange-500 to-red-500",
    },
  ]

  const team = [
    {
      name: "Ahmet Yılmaz",
      role: "Kurucu & CEO",
      description: "15+ yıl fintech deneyimi",
      avatar: "AY",
    },
    {
      name: "Elif Kaya",
      role: "CTO",
      description: "AI ve makine öğrenmesi uzmanı",
      avatar: "EK",
    },
    {
      name: "Mehmet Demir",
      role: "CPO",
      description: "Ürün geliştirme lideri",
      avatar: "MD",
    },
    {
      name: "Ayşe Öztürk",
      role: "CFO",
      description: "Finans ve operasyon uzmanı",
      avatar: "AÖ",
    },
  ]

  const milestones = [
    {
      year: "2020",
      title: "Kuruluş",
      description: "KrediTakip'in temelleri atıldı",
    },
    {
      year: "2021",
      title: "İlk Ürün",
      description: "OCR teknolojisi ile MVP lansmanı",
    },
    {
      year: "2022",
      title: "AI Entegrasyonu",
      description: "Yapay zeka destekli analiz sistemi",
    },
    {
      year: "2023",
      title: "Büyük Büyüme",
      description: "10,000+ aktif kullanıcıya ulaştık",
    },
    {
      year: "2024",
      title: "Liderlik",
      description: "Türkiye'nin #1 kredi yönetim platformu",
    },
  ]

  const stats = [
    { value: "25K+", label: "Aktif Kullanıcı", icon: Users },
    { value: "₺2.5M+", label: "Toplam Tasarruf", icon: TrendingUp },
    { value: "99.9%", label: "Uptime", icon: Shield },
    { value: "4.9/5", label: "Müşteri Puanı", icon: Star },
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
              <Heart className="mr-2 h-5 w-5" />
              Hakkımızda
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Finansal Geleceği{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Şekillendiriyoruz
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              2020'den beri Türkiye'de kredi yönetimini devrim niteliğinde değiştiren teknolojiler geliştiriyoruz.
              Misyonumuz, herkesi finansal özgürlüğe ulaştırmak.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Misyonumuz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Kredi yönetimini herkes için erişilebilir, anlaşılır ve verimli hale getirmek. Yapay zeka ve modern
                  teknolojilerle finansal kararları destekleyerek, müşterilerimizin ekonomik refahını artırmayı
                  hedefliyoruz.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Vizyonumuz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Türkiye'nin ve bölgenin en güvenilir finansal teknoloji şirketi olmak. İnovasyonla öncülük ederek,
                  milyonlarca insanın finansal özgürlüğüne kavuşmasına katkıda bulunmak istiyoruz.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Değerlerimiz</h2>
            <p className="text-xl text-gray-300">Bizi yönlendiren temel prensipler</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 text-center hover:border-emerald-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center`}
                  >
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Yolculuğumuz</h2>
            <p className="text-xl text-gray-300">Başarı hikayemizin kilometre taşları</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-500"></div>

              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {milestone.year}
                    </div>
                    <div className="ml-8">
                      <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                      <p className="text-gray-300">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ekibimiz</h2>
            <p className="text-xl text-gray-300">Başarımızın arkasındaki yetenekli insanlar</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 text-center hover:border-emerald-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {member.avatar}
                  </div>
                  <CardTitle className="text-white">{member.name}</CardTitle>
                  <CardDescription className="text-emerald-400 font-semibold">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Certifications */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ödüller & Sertifikalar</h2>
            <p className="text-xl text-gray-300">Kalitemizi tescilleyen başarılarımız</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "SOC 2 Type II",
                description: "Güvenlik ve gizlilik sertifikası",
                icon: Shield,
                color: "from-emerald-500 to-teal-500",
              },
              {
                title: "ISO 27001",
                description: "Bilgi güvenliği yönetim sistemi",
                icon: Award,
                color: "from-blue-500 to-cyan-500",
              },
              {
                title: "KVKK Uyumlu",
                description: "Kişisel verilerin korunması",
                icon: CheckCircle,
                color: "from-purple-500 to-pink-500",
              },
            ].map((cert, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 text-center">
                <CardHeader>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${cert.color} rounded-2xl flex items-center justify-center`}
                  >
                    <cert.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white">{cert.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Bizimle Çalışmaya Hazır mısınız?</h2>
            <p className="text-xl text-gray-300 mb-8">Finansal geleceğinizi güvence altına almak için bugün başlayın</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                onClick={() => router.push("/giris")}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-emerald-500"
                onClick={() => router.push("/iletisim")}
              >
                <Globe className="mr-2 h-5 w-5" />
                İletişime Geç
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
