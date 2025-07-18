import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Scan,
  TrendingUp,
  Shield,
  Users,
  AreaChart,
  Zap,
  Database,
  Smartphone,
  Globe,
  CheckCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Bell,
  Lock,
  Wifi,
  Cloud,
  RefreshCw,
} from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-teal-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Gelişmiş Özellikler</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-emerald-400">Güçlü Özellikler</span> ile
              <br />
              Kredi Yönetiminizi Dönüştürün
            </h1>
            <p className="text-xl text-white/70 max-w-4xl mx-auto mb-8 leading-relaxed">
              KrediTakip'in sunduğu gelişmiş özellikler ile finansal verilerinizi analiz edin, akıllı planlar oluşturun
              ve kredi yönetiminizde tam kontrol sağlayın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
                >
                  Ücretsiz Deneyin
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                >
                Demo İzle
              </Button>
            </div>
          </div>
        </section>

        {/* Hero Visual Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-4 right-4 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10 grid md:grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                    <Image
                      src="/ocr-scanning-interface.png"
                      alt="OCR Teknolojisi"
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-semibold text-white mb-2">OCR Teknolojisi</h3>
                    <p className="text-white/60 text-sm">Belgeleri anında dijital veriye dönüştürün</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                    <Image
                      src="/financial-analytics-dashboard.png"
                      alt="Analitik Dashboard"
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-semibold text-white mb-2">Gelişmiş Analitik</h3>
                    <p className="text-white/60 text-sm">Detaylı finansal raporlar ve analizler</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                    <Image
                      src="/mobile-banking-security-shield.png"
                      alt="Güvenlik"
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-semibold text-white mb-2">Bankacılık Güvenliği</h3>
                    <p className="text-white/60 text-sm">256-bit SSL şifreleme ile maksimum güvenlik</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Temel <span className="text-emerald-400">Özellikler</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Her özellik, finansal yönetiminizi kolaylaştırmak ve optimize etmek için tasarlandı
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {/* OCR Technology */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/ocr-ai-scanning.png"
                      alt="OCR Teknolojisi"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-emerald-500/80 to-emerald-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Scan className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Gelişmiş OCR Teknolojisi</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    %99.8 doğruluk oranıyla PDF, JPG ve PNG formatındaki kredi dökümlerinizi saniyeler içinde dijital
                    veriye dönüştürün.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Çoklu format desteği</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>AI destekli analiz</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>3 saniyeden kısa işlem</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Smart Payment Plans */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/ai-payment-calculator.png"
                      alt="Akıllı Ödeme Planları"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-teal-500/80 to-teal-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Akıllı Ödeme Planları</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Yapay zeka destekli algoritma ile kişiselleştirilmiş ödeme planları oluşturun ve borcunuzu optimize
                    edin.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Kişiselleştirilmiş planlar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Faiz optimizasyonu</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Otomatik güncellemeler</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Analytics */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/financial-dashboard-colorful.png"
                      alt="Gelişmiş Analitik"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-emerald-500/80 to-emerald-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <AreaChart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Gelişmiş Analitik</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Harcama kategorileri, trend analizi ve finansal öngörüler ile detaylı raporlar alın.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Interaktif grafikler</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Kategori analizi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Trend tahminleri</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/cybersecurity-shield-banking.png"
                      alt="Bankacılık Seviyesi Güvenlik"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-teal-500/80 to-teal-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Bankacılık Seviyesi Güvenlik</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    256-bit SSL şifreleme ve ISO 27001 sertifikası ile verileriniz maksimum güvenlik altında.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>256-bit SSL şifreleme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>ISO 27001 sertifikalı</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>KVKK uyumlu</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multi-Bank Support */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/placeholder-nmdc3.png"
                      alt="Çoklu Banka Desteği"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-emerald-500/80 to-emerald-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Çoklu Banka Desteği</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Türkiye'deki 25+ bankanın kredi dökümlerini destekleyen geniş uyumluluk.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>25+ banka desteği</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Otomatik format tanıma</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Sürekli güncellenen liste</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Processing */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative mb-6">
                    <Image
                      src="/real-time-cloud-speed.png"
                      alt="Gerçek Zamanlı İşlem"
                      width={280}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-teal-500/80 to-teal-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Gerçek Zamanlı İşlem</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Bulut tabanlı altyapı ile anında işlem ve sınırsız kapasite.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>{"<3 saniye işlem süresi"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Sınırsız kapasite</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>99.9% uptime garantisi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Gelişmiş <span className="text-teal-400">Özellikler</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Profesyonel kullanıcılar için tasarlanmış ileri düzey araçlar
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              {/* Feature 1 */}
              <div>
                <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Detaylı Raporlama</h3>
                  </div>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Kapsamlı finansal raporlar ile harcama alışkanlıklarınızı analiz edin. PDF ve Excel formatında dışa
                    aktarım yapın.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <PieChart className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-sm text-white/80 font-medium">Kategori Dağılımı</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <Calendar className="w-8 h-8 text-teal-400 mb-2" />
                      <p className="text-sm text-white/80 font-medium">Aylık Trendler</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
                <Image
                  src="/financial-dashboard.png"
                  alt="Detaylı Raporlama"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-xl order-2 lg:order-1">
                <Image
                  src="/smart-notification-system.png"
                  alt="Akıllı Bildirimler"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Akıllı Bildirimler</h3>
                  </div>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Ödeme tarihleri, limit aşımları ve önemli finansal değişiklikler için otomatik bildirimler alın.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Ödeme hatırlatıcıları</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Limit aşım uyarıları</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Faiz oranı değişiklikleri</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Feature 3 */}
              <div>
                <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Mobil Uyumluluk</h3>
                  </div>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    Responsive tasarım ile tüm cihazlarda mükemmel deneyim. PWA desteği ile mobil uygulama hissi.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Smartphone className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-white/80">Mobil</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Database className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                      <p className="text-xs text-white/80">Tablet</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Globe className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-white/80">Desktop</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
                <Image
                  src="/placeholder.svg?height=300&width=400"
                  alt="Mobil Uyumluluk"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Technology Showcase */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Teknoloji <span className="text-emerald-400">Vitrini</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">En son teknolojiler ile güçlendirilmiş platform</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <Image
                  src="/placeholder.svg?height=250&width=400"
                  alt="AI Teknolojisi"
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover rounded-2xl mb-6"
                />
                <h3 className="text-2xl font-bold text-white mb-4">Yapay Zeka Destekli</h3>
                <p className="text-white/70 leading-relaxed">
                  Machine Learning algoritmaları ile sürekli öğrenen ve gelişen sistem. Verilerinizi analiz ederek size
                  özel öneriler sunar.
                </p>
              </div>
              <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <Image
                  src="/placeholder.svg?height=250&width=400"
                  alt="Bulut Teknolojisi"
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover rounded-2xl mb-6"
                />
                <h3 className="text-2xl font-bold text-white mb-4">Bulut Tabanlı Altyapı</h3>
                <p className="text-white/70 leading-relaxed">
                  AWS tabanlı ölçeklenebilir mimari ile yüksek performans ve güvenilirlik. Verileriniz her zaman güvende
                  ve erişilebilir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Teknik <span className="text-emerald-400">Özellikler</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Güçlü altyapı ve modern teknolojiler ile desteklenen platform
              </p>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Cloud className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Bulut Altyapı</h3>
                  <p className="text-white/60 text-sm">AWS tabanlı ölçeklenebilir mimari</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Güvenlik</h3>
                  <p className="text-white/60 text-sm">End-to-end şifreleme</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">API Entegrasyonu</h3>
                  <p className="text-white/60 text-sm">RESTful API desteği</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Otomatik Yedekleme</h3>
                  <p className="text-white/60 text-sm">Günlük otomatik yedekleme</p>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-3 gap-8">
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Performans</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">İşlem Süresi</span>
                      <span className="text-emerald-400 text-sm font-medium">{"<3s"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Uptime</span>
                      <span className="text-emerald-400 text-sm font-medium">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Doğruluk Oranı</span>
                      <span className="text-emerald-400 text-sm font-medium">99.8%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Kapasite</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Dosya Boyutu</span>
                      <span className="text-teal-400 text-sm font-medium">10MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Aylık İşlem</span>
                      <span className="text-teal-400 text-sm font-medium">Sınırsız</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Depolama</span>
                      <span className="text-teal-400 text-sm font-medium">1GB</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Uyumluluk</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Desteklenen Bankalar</span>
                      <span className="text-emerald-400 text-sm font-medium">25+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Dosya Formatları</span>
                      <span className="text-emerald-400 text-sm font-medium">PDF, JPG, PNG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Dil Desteği</span>
                      <span className="text-emerald-400 text-sm font-medium">TR, EN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Plan <span className="text-teal-400">Karşılaştırması</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                İhtiyacınıza en uygun planı seçin ve tüm özelliklerden yararlanın
              </p>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-6 text-white font-semibold">Özellikler</th>
                      <th className="text-center p-6 text-white font-semibold">Ücretsiz</th>
                      <th className="text-center p-6 text-white font-semibold">Pro</th>
                      <th className="text-center p-6 text-white font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-6 text-white/80">OCR İşlem Sayısı</td>
                      <td className="p-6 text-center text-white/60">5/ay</td>
                      <td className="p-6 text-center text-emerald-400">100/ay</td>
                      <td className="p-6 text-center text-teal-400">Sınırsız</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-6 text-white/80">Akıllı Ödeme Planları</td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-6 text-white/80">Gelişmiş Analitik</td>
                      <td className="p-6 text-center text-white/40">-</td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-6 text-white/80">API Erişimi</td>
                      <td className="p-6 text-center text-white/40">-</td>
                      <td className="p-6 text-center text-white/40">-</td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-white/80">Öncelikli Destek</td>
                      <td className="p-6 text-center text-white/40">-</td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Tüm Özellikleri <span className="text-emerald-400">Keşfedin</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  KrediTakip'in güçlü özelliklerini deneyimleyin ve finansal yönetiminizi bir üst seviyeye taşıyın
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/giris">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                    >
                      Ücretsiz Başla
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                >
                Demo Talep Et
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
