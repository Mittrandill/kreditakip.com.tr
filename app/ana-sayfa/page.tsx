"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, TrendingUp, Shield, FileText, Bot, Bell, ArrowRight, Star, Users, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: CreditCard,
    title: "Kredi Takibi",
    description: "Tüm kredilerinizi tek yerden takip edin, ödeme planlarınızı görüntüleyin",
    color: "bg-blue-500",
  },
  {
    icon: Bot,
    title: "Yapay Zeka Analizi",
    description: "AI destekli refinansman önerileri ve risk analizleri",
    color: "bg-purple-500",
  },
  {
    icon: FileText,
    title: "PDF Yükleme",
    description: "Kredi belgelerinizi yükleyin, otomatik olarak analiz edilsin",
    color: "bg-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Detaylı Raporlar",
    description: "Grafikler ve analizlerle kredi durumunuzu görselleştirin",
    color: "bg-orange-500",
  },
  {
    icon: Bell,
    title: "Akıllı Bildirimler",
    description: "Ödeme tarihleri yaklaştığında otomatik hatırlatmalar",
    color: "bg-teal-500",
  },
  {
    icon: Shield,
    title: "Güvenli Veri",
    description: "Verileriniz şifrelenmiş ve güvenli şekilde saklanır",
    color: "bg-red-500",
  },
]

const stats = [
  { label: "Aktif Kullanıcı", value: "10,000+", icon: Users },
  { label: "Takip Edilen Kredi", value: "50,000+", icon: CreditCard },
  { label: "Kullanıcı Memnuniyeti", value: "98%", icon: Star },
  { label: "Aylık Tasarruf", value: "₺2,500", icon: TrendingUp },
]

export default function LandingPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">KrediTakip</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#ozellikler" className="text-gray-600 hover:text-teal-600 dark:text-gray-300">
              Özellikler
            </Link>
            <Link href="#hakkimizda" className="text-gray-600 hover:text-teal-600 dark:text-gray-300">
              Hakkımızda
            </Link>
            <Link href="#iletisim" className="text-gray-600 hover:text-teal-600 dark:text-gray-300">
              İletişim
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/giris")}>
              Giriş Yap
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => router.push("/giris")}>
              Başlayın
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-teal-100 text-teal-700 hover:bg-teal-200">🚀 Yeni: AI Destekli Kredi Analizi</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Kredilerinizi{" "}
          <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">Akıllıca</span>{" "}
          Yönetin
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Tüm kredilerinizi tek platformda takip edin, yapay zeka destekli analizlerle en iyi refinansman fırsatlarını
          yakalayın ve ödeme planlarınızı optimize edin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-teal-500 hover:bg-teal-600 text-lg px-8"
            onClick={() => router.push("/giris")}
          >
            Ücretsiz Başlayın
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => window.open("#demo", "_blank")}>
            Demo İzleyin
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg mb-4">
                <stat.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Güçlü Özellikler</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Kredi yönetiminizi kolaylaştıran ve optimize eden gelişmiş araçlar
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg"
            >
              <CardHeader>
                <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} rounded-lg mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-teal-500 dark:bg-teal-600">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Kredi Yönetiminizi Bugün Başlatın</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Binlerce kullanıcının güvendiği platform ile kredilerinizi daha akıllı yönetin
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => router.push("/giris")}>
            Hemen Başlayın
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">KrediTakip</span>
              </div>
              <p className="text-gray-400">Kredilerinizi akıllıca yönetin, geleceğinizi güvence altına alın.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Özellikler
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Fiyatlandırma
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Yardım Merkezi
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    İletişim
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Durum
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Yasal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Gizlilik
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Şartlar
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Çerezler
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KrediTakip. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
