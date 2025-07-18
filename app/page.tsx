import { AreaChart, FileText, Scan, TrendingUp, Shield, Clock, Users, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserGrowthChart } from '@/components/user-growth-chart';
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="mt-10 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto relative bg-black/20 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl shadow-emerald-500/5">
            {/* Floating Visuals */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] w-full h-full flex justify-center items-center z-0 pointer-events-none">
              <div className="w-64 h-80 bg-white/5 border border-white/10 rounded-2xl -rotate-12 transform transition-transform duration-500 hover:scale-105 shadow-lg p-4 flex flex-col">
                <FileText className="w-8 h-8 text-white/30 mb-4" />
                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/10 rounded-full" />
                  <div className="w-5/6 h-3 bg-white/10 rounded-full" />
                  <div className="w-full h-3 bg-white/10 rounded-full" />
                  <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                </div>
                <p className="text-xs text-white/30 mt-auto">Kredi Dökümü.pdf</p>
              </div>
              <div className="w-64 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 rounded-2xl rotate-6 transform transition-transform duration-500 hover:scale-105 shadow-lg ml-[-4rem] p-4 flex flex-col">
                <AreaChart className="w-8 h-8 text-emerald-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-white/80">Ödeme Planı</p>
                  <div className="w-full h-8 bg-white/10 rounded-lg flex items-center px-2">
                    <div className="w-1/3 h-4 bg-emerald-500/50 rounded-full" />
                  </div>
                  <div className="w-full h-8 bg-white/10 rounded-lg flex items-center px-2">
                    <div className="w-1/2 h-4 bg-emerald-500/50 rounded-full" />
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-auto">Dijital Ödeme Planı</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-left">
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-white">1.2M+</p>
                  <p className="text-white/60">Analiz Edilen Döküm</p>
                </div>
                <div className="hidden lg:block" />
                <div className="space-y-2 md:text-right">
                  <p className="text-4xl font-bold text-white">99.8%</p>
                  <p className="text-white/60">OCR Doğruluk Oranı</p>
                </div>
              </div>

              <div className="mt-64" />

              <div className="grid md:grid-cols-2 gap-12 items-end">
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                    Kredi Yönetiminin <span className="text-emerald-400">Geleceği</span>
                  </h1>
                  <p className="text-lg text-white/70 max-w-md">
                    OCR teknolojisi ile kredi dökümlerinizi saniyeler içinde akıllı dijital ödeme planlarına dönüştürün
                    ve finansal durumunuzu kontrol altına alın.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/giris">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
                      >
                        Hemen Başla
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
                <div>
                  <UserGrowthChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] border border-white/5 rounded-full" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Neden Bizi Seçmelisiniz?</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                Neden <span className="text-emerald-400">Kredi Takip</span>?
              </h2>
              <p className="text-xl text-white/70 max-w-4xl mx-auto leading-relaxed">
                Gelişmiş teknoloji ve kullanıcı dostu arayüzle kredi yönetiminizi bir üst seviyeye taşıyın
              </p>
            </div>

            {/* Main Feature Grid */}
            <div className="relative">
              {/* Central Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center z-20">
                <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
                  <Scan className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              {/* Feature Cards arranged in a circle */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* OCR Technology */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      {/* Floating Icon */}
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                          <Scan className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Gelişmiş OCR Teknolojisi</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        %99.8 doğruluk oranıyla kredi dökümlerinizi saniyeler içinde dijital formata dönüştürün
                      </p>

                      {/* Stats */}
                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">99.8%</div>
                          <div className="text-xs text-white/60">Doğruluk</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">{"<3s"}</div>
                          <div className="text-xs text-white/60">İşlem</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Smart Payment Plans */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                          <TrendingUp className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Akıllı Ödeme Planları</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        AI destekli algoritma ile kişiselleştirilmiş ödeme planları oluşturun ve borcunuzu optimize edin
                      </p>

                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">AI</div>
                          <div className="text-xs text-white/60">Destekli</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">24/7</div>
                          <div className="text-xs text-white/60">Aktif</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Security */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                          <Shield className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Güvenli ve Gizli</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        Bankacılık seviyesinde şifreleme ile verileriniz tamamen güvende ve gizli kalır
                      </p>

                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">SSL</div>
                          <div className="text-xs text-white/60">Şifreli</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">256</div>
                          <div className="text-xs text-white/60">Bit</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Instant Processing */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                          <Clock className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Anında İşlem</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        3 saniyeden kısa sürede dökümünüzü analiz edip dijital ödeme planınızı hazırlayın
                      </p>

                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">{"<3s"}</div>
                          <div className="text-xs text-white/60">Süre</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">∞</div>
                          <div className="text-xs text-white/60">Kapasite</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Multi-Bank Support */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                          <Users className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Çoklu Banka Desteği</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        Türkiye'deki tüm büyük bankaların kredi dökümlerini destekleyen geniş uyumluluk
                      </p>

                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">25+</div>
                          <div className="text-xs text-white/60">Banka</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">100%</div>
                          <div className="text-xs text-white/60">Uyumlu</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                    <CardContent className="p-10">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                          <AreaChart className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 text-center">Detaylı Analiz</h3>
                      <p className="text-white/70 text-center leading-relaxed mb-6">
                        Harcama kategorileri, trend analizi ve finansal öngörüler ile tam kontrol
                      </p>

                      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">360°</div>
                          <div className="text-xs text-white/60">Görünüm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-400">Real</div>
                          <div className="text-xs text-white/60">Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Connecting Lines */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 600">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(109, 222, 229, 0.1)" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="rgba(109, 222, 229, 0.1)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 200 300 Q 400 200 600 300"
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                  <path
                    d="M 200 300 Q 400 400 600 300"
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                </svg>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-20">
              <div className="inline-flex items-center gap-4 bg-black/20 border border-white/10 rounded-2xl px-8 py-6 backdrop-blur-xl">
                <div className="flex -space-x-4">
                  <img
                    src="/turkish-woman-smiling.png"
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                  />
                  <img
                    src="/turkish-businessman.png"
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                  />
                  <img
                    src="/young-turkish-professional-man.png"
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                  />
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-emerald-500/20 flex items-center justify-center text-xs text-white font-medium">
                    +1M
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">1.2M+ kullanıcı güveniyor</p>
                  <p className="text-white/60 text-sm">Siz de aramıza katılın</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Süreç Adımları</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                Nasıl <span className="text-emerald-400">Çalışır</span>?
              </h2>
              <p className="text-xl text-white/70 max-w-4xl mx-auto leading-relaxed">
                Sadece 3 basit adımda kredi dökümünüzü akıllı ödeme planına dönüştürün
              </p>
            </div>

            {/* Process Flow */}
            <div className="relative max-w-7xl mx-auto">
              {/* Animated Flow Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 hidden lg:block">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/40 to-emerald-500/20 rounded-full" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent rounded-full animate-pulse" />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
                {/* Step 1: Upload Document */}
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700" />

                  <div className="relative bg-black/20 border-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-10 hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    {/* Step Number */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-500/80 rounded-full flex items-center justify-center text-brand-dark font-bold text-lg border-4 border-brand-dark shadow-lg">
                      1
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-8 pt-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                        <FileText className="w-12 h-12 text-emerald-400" />
                      </div>

                      {/* Floating Elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                      <div
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-500/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.5s" }}
                      />
                    </div>

                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6 text-center">Döküm Yükle</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-8">
                      Kredi kartı veya banka dökümünüzü PDF, JPG veya PNG formatında güvenli bir şekilde yükleyin
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>PDF, JPG, PNG desteği</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>256-bit SSL şifreleme</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>Maksimum 10MB dosya boyutu</span>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="bg-white/5 rounded-full h-2 mb-4">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-500/80 h-2 rounded-full w-1/3 transition-all duration-1000" />
                    </div>
                    <p className="text-xs text-white/50 text-center">Adım 1/3 tamamlandı</p>
                  </div>

                  {/* Connection Arrow */}
                  <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl flex items-center justify-center group-hover:border-emerald-500/30 transition-all duration-500">
                      <ArrowRight className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Step 2: OCR Analysis */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700" />

                  <div className="relative bg-black/20 border-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-10 hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-500/80 rounded-full flex items-center justify-center text-brand-dark font-bold text-lg border-4 border-brand-dark shadow-lg">
                      2
                    </div>

                    <div className="relative mb-8 pt-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20 group-hover:from-teal-500/40 group-hover:to-teal-500/20 transition-all duration-500">
                        <Scan className="w-12 h-12 text-teal-400" />
                      </div>

                      {/* Scanning Animation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-2 border-teal-500/30 rounded-3xl animate-ping" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                      <div
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-teal-500/60 rounded-full animate-bounce"
                        style={{ animationDelay: "1s" }}
                      />
                    </div>

                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6 text-center">OCR Analizi</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-8">
                      Gelişmiş yapay zeka teknolojimiz dökümünüzü analiz eder ve tüm verileri hassas bir şekilde çıkarır
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>%99.8 doğruluk oranı</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>AI destekli analiz</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>3 saniyeden kısa süre</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-full h-2 mb-4">
                      <div className="bg-gradient-to-r from-teal-500 to-teal-500/80 h-2 rounded-full w-2/3 transition-all duration-1000" />
                    </div>
                    <p className="text-xs text-white/50 text-center">Adım 2/3 tamamlandı</p>
                  </div>

                  <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl flex items-center justify-center group-hover:border-teal-500/30 transition-all duration-500">
                      <ArrowRight className="w-6 h-6 text-teal-400" />
                    </div>
                  </div>
                </div>

                {/* Step 3: Get Payment Plan */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700" />

                  <div className="relative bg-black/20 border-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-10 hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-500/80 rounded-full flex items-center justify-center text-brand-dark font-bold text-lg border-4 border-brand-dark shadow-lg">
                      3
                    </div>

                    <div className="relative mb-8 pt-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20 group-hover:from-emerald-500/40 group-hover:to-emerald-500/20 transition-all duration-500">
                        <TrendingUp className="w-12 h-12 text-emerald-400" />
                      </div>

                      {/* Success Animation */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                      <div
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-500/60 rounded-full animate-bounce"
                        style={{ animationDelay: "1.5s" }}
                      />

                      {/* Floating Success Indicators */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center animate-ping">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                      </div>
                    </div>

                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6 text-center">Plan Al</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-8">
                      Kişiselleştirilmiş ödeme planınızı alın ve finansal hedeflerinize ulaşmak için akıllı öneriler
                      edinin
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>Kişiselleştirilmiş plan</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>Akıllı öneriler</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span>Anında sonuç</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-full h-2 mb-4">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-500/80 h-2 rounded-full w-full transition-all duration-1000" />
                    </div>
                    <p className="text-xs text-white/50 text-center">Tüm adımlar tamamlandı ✓</p>
                  </div>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="text-center bg-black/20 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{"<3s"}</div>
                  <div className="text-white/60 text-sm">Ortalama İşlem Süresi</div>
                </div>
                <div className="text-center bg-black/20 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="text-3xl font-bold text-teal-400 mb-2">99.8%</div>
                  <div className="text-white/60 text-sm">Doğruluk Oranı</div>
                </div>
                <div className="text-center bg-black/20 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">25+</div>
                  <div className="text-white/60 text-sm">Desteklenen Banka</div>
                </div>
                <div className="text-center bg-black/20 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="text-3xl font-bold text-teal-400 mb-2">1.2M+</div>
                  <div className="text-white/60 text-sm">Mutlu Kullanıcı</div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center mt-16">
                <div className="inline-flex items-center gap-4 bg-black/20 border border-white/10 rounded-2xl px-8 py-6 backdrop-blur-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Hemen başlamaya hazır mısınız?</p>
                    <p className="text-white/60 text-sm">İlk analiz tamamen ücretsiz</p>
                  </div>
                  <Link href="/giris">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600">
                      Başla
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Kullanıcılarımız <span className="text-emerald-400">Ne Diyor</span>?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-emerald-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6">
                    "KrediTakip sayesinde karmaşık kredi dökümlerimi anlamak çok kolay oldu. Ödeme planım artık çok daha
                    organize!"
                  </p>
                  <div className="flex items-center">
                    <img
                      src="/professional-turkish-woman.png"
                      alt="Ayşe Yılmaz"
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="text-white font-semibold">Ayşe Yılmaz</p>
                      <p className="text-white/60 text-sm">Öğretmen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-emerald-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6">
                    "OCR teknolojisi gerçekten etkileyici. Saniyeler içinde tüm bilgilerimi dijital ortama aktardı."
                  </p>
                  <div className="flex items-center">
                    <img
                      src="/turkish-businessman.png"
                      alt="Mehmet Kaya"
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="text-white font-semibold">Mehmet Kaya</p>
                      <p className="text-white/60 text-sm">Mühendis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-emerald-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6">
                    "Finansal durumumu bu kadar net görebileceğimi hiç düşünmemiştim. Harika bir uygulama!"
                  </p>
                  <div className="flex items-center">
                    <img
                      src="/placeholder.svg?height=48&width=48"
                      alt="Elif Özkan"
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="text-white font-semibold">Elif Özkan</p>
                      <p className="text-white/60 text-sm">Girişimci</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-black/20 border border-white/10 rounded-3xl p-12 md:p-16 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Finansal Özgürlüğünüze <span className="text-emerald-400">Başlayın</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Kredi yönetiminizi bir sonraki seviyeye taşımak için bugün KrediTakip'e katılın
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
