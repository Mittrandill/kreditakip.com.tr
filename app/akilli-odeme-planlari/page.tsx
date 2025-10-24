import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp,
  Calculator,
  Calendar,
  PieChart,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
} from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function SmartPaymentPlansPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-teal-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 text-sm font-medium">AI Destekli Planlama</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-emerald-400">Akıllı Ödeme Planları</span> ile
              <br />
              Borcunuzu Optimize Edin
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Yapay zeka destekli algoritmamız, gelir ve harcama alışkanlıklarınızı analiz ederek size özel ödeme
              planları oluşturur. Faiz maliyetlerinizi minimize edin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
                >
                  Planınızı Oluşturun
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-400">%40</div>
                  <div className="text-white/60 text-sm">Faiz Tasarrufu</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-teal-400">6 Ay</div>
                  <div className="text-white/60 text-sm">Daha Hızlı Ödeme</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-400">100%</div>
                  <div className="text-white/60 text-sm">Kişiselleştirilmiş</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-teal-400">7/24</div>
                  <div className="text-white/60 text-sm">Otomatik Güncelleme</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Nasıl <span className="text-emerald-400">Çalışır?</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Dört basit adımda kişiselleştirilmiş ödeme planınızı oluşturun
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calculator className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold text-emerald-400 mb-4">1</div>
                  <h3 className="text-xl font-bold text-white mb-4">Borç Analizi</h3>
                  <p className="text-white/70 text-sm">Tüm kredilerinizi sisteme ekleyin ve detaylı analiz yapın</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-8 h-8 text-teal-400" />
                  </div>
                  <div className="text-4xl font-bold text-teal-400 mb-4">2</div>
                  <h3 className="text-xl font-bold text-white mb-4">Gelir Belirleme</h3>
                  <p className="text-white/70 text-sm">Aylık gelirinizi ve ödeme kapasitinizi belirleyin</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold text-emerald-400 mb-4">3</div>
                  <h3 className="text-xl font-bold text-white mb-4">AI Optimizasyonu</h3>
                  <p className="text-white/70 text-sm">Yapay zeka en optimal ödeme planını oluşturur</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-teal-400" />
                  </div>
                  <div className="text-4xl font-bold text-teal-400 mb-4">4</div>
                  <h3 className="text-xl font-bold text-white mb-4">Takip & Güncelleme</h3>
                  <p className="text-white/70 text-sm">Planınızı takip edin ve otomatik güncellemelerden faydalanın</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Plan <span className="text-teal-400">Özellikleri</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Faiz Optimizasyonu</h3>
                  <p className="text-white/70 mb-4">
                    Yüksek faizli kredileri önceliklendirerek toplam faiz maliyetinizi minimize edin
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Akıllı önceliklendirme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Faiz tasarrufu hesaplama</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6">
                    <PieChart className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Bütçe Yönetimi</h3>
                  <p className="text-white/70 mb-4">Gelirinize uygun ödeme planları ile bütçenizi dengede tutun</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Gelir-gider analizi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Esnek ödeme seçenekleri</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">İlerleme Takibi</h3>
                  <p className="text-white/70 mb-4">
                    Ödeme ilerlemenizi görsel grafiklerle takip edin ve motivasyonunuzu koruyun
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Görsel raporlar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Milestone bildirimleri</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Otomatik Güncelleme</h3>
                  <p className="text-white/70 mb-4">
                    Finansal durumunuzdaki değişikliklere göre planınız otomatik güncellenir
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Gerçek zamanlı optimizasyon</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Akıllı öneriler</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Ödeme Hatırlatıcıları</h3>
                  <p className="text-white/70 mb-4">
                    Ödeme tarihlerinizi asla kaçırmayın, otomatik hatırlatıcılar alın
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>E-posta bildirimleri</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Özelleştirilebilir hatırlatmalar</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Güvenli Planlama</h3>
                  <p className="text-white/70 mb-4">Finansal verileriniz bankacılık seviyesi güvenlik ile korunur</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>256-bit şifreleme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>KVKK uyumlu</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  Akıllı Planınızı <span className="text-emerald-400">Oluşturun</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Yapay zeka destekli ödeme planları ile borcunuzu daha hızlı ve daha az faizle ödeyin
                </p>
                <Link href="/giris">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                  >
                    Hemen Başlayın
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
