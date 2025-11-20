import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Scan,
  TrendingUp,
  Shield,
  Calendar,
  BarChart3,
  Bell,
  CreditCard,
  LineChart,
  FileText,
  Zap,
  Lock,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Target,
  Wallet,
  PieChart,
  Database,
  Globe,
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
              <span className="text-white/80 text-sm font-medium">Tüm Özellikler</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-emerald-400">Güçlü Araçlar</span> ile
              <br />
              Finansal Kontrolü Elinize Alın
            </h1>
            <p className="text-xl text-white/70 max-w-4xl mx-auto mb-8 leading-relaxed">
              Kredi Takip'in sunduğu gelişmiş özellikler ile kredilerinizi yönetin,
              akıllı planlar oluşturun ve finansal hedeflerinize ulaşın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                >
                  Ücretsiz Deneyin
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
              >
                Demo İzle
              </Button>
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
                Ana <span className="text-emerald-400">Özellikler</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Her özellik, finansal yönetiminizi kolaylaştırmak ve optimize etmek için tasarlandı
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {/* OCR Technology */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                        <Scan className="w-10 h-10 text-emerald-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Gelişmiş OCR Teknolojisi</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-6">
                      %99.8 doğruluk oranıyla PDF, JPG ve PNG formatındaki kredi ekstrelerinizi saniyeler içinde dijital veriye dönüştürün.
                    </p>
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
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                        <Calendar className="w-10 h-10 text-teal-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Akıllı Ödeme Planları</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-6">
                      Yapay zeka destekli algoritma ile kişiselleştirilmiş ödeme planları oluşturun ve borcunuzu optimize edin.
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

              {/* Risk Analysis */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                        <ShieldCheck className="w-10 h-10 text-emerald-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">AI Finansal Sağlık Özeti</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-6">
                      Finansal durumunuzu detaylı analiz edin. Borç/gelir oranı, nakit akışı ve risk skorunuzu görün.
                    </p>
                    <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">DTI</div>
                        <div className="text-xs text-white/60">Analiz</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">Pro</div>
                        <div className="text-xs text-white/60">Öneriler</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Refinancing Analysis */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                        <TrendingUp className="w-10 h-10 text-teal-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Refinansman Analizi</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-6">
                      Kredilerinizi yeniden yapılandırma fırsatlarını keşfedin. Potansiyel tasarrufları hesaplayın.
                    </p>
                    <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">₺</div>
                        <div className="text-xs text-white/60">Tasarruf</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">%</div>
                        <div className="text-xs text-white/60">Fırsat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Reports */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                        <BarChart3 className="w-10 h-10 text-teal-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Detaylı Raporlar</h3>
                    <p className="text-white/70 text-center leading-relaxed mb-6">
                      Finansal durumunuzu görselleştirin. İnteraktif grafikler ve detaylı analizler.
                    </p>
                    <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">PDF</div>
                        <div className="text-xs text-white/60">Export</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">XLS</div>
                        <div className="text-xs text-white/60">Export</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase with Visuals */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            {/* Credit Management */}
            <div className="mb-32">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative">
                  <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-6">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80 text-sm font-medium">Kredi Yönetimi</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Tüm Kredilerinizi <span className="text-emerald-400">Tek Yerden</span> Yönetin
                  </h2>
                  <p className="text-lg text-white/70 mb-8 leading-relaxed">
                    Birden fazla bankada kredileriniz mi var? Hepsini tek bir platformda toplayın.
                    Her kredinin durumunu, kalan borcunu ve ödeme planını anlık görün.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Çoklu Kredi Takibi</h4>
                        <p className="text-white/60">Sınırsız sayıda kredi ekleyin ve yönetin</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Otomatik Güncelleme</h4>
                        <p className="text-white/60">Ödeme yaptıkça bakiyeler otomatik güncellenir</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Gecikme Uyarıları</h4>
                        <p className="text-white/60">Ödeme tarihi yaklaşan krediler için bildirim alın</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-emerald-400" />
                        <h3 className="text-xl font-bold">Kredilerim</h3>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm text-emerald-400">
                        3 Aktif
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-4 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Konut Kredisi</span>
                          <span className="text-xs text-emerald-400">%45 ödendi</span>
                        </div>
                        <div className="text-2xl font-bold mb-2">₺450,000</div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: "45%" }} />
                        </div>
                      </div>
                      <div className="bg-black/10 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Taşıt Kredisi</span>
                          <span className="text-xs text-teal-400">%70 ödendi</span>
                        </div>
                        <div className="text-2xl font-bold mb-2">₺85,000</div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: "70%" }} />
                        </div>
                      </div>
                      <div className="bg-black/10 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">İhtiyaç Kredisi</span>
                          <span className="text-xs text-emerald-400">%25 ödendi</span>
                        </div>
                        <div className="text-2xl font-bold mb-2">₺25,000</div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: "25%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Notifications */}
            <div className="mb-32">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <Bell className="w-8 h-8 text-teal-400" />
                      <h3 className="text-xl font-bold">Bildirimler</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-teal-500/10 rounded-lg border border-teal-500/20">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                          <Calendar className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Ödeme Yaklaşıyor</p>
                          <p className="text-sm text-white/60">Konut kredisi ödemesi 3 gün sonra</p>
                          <p className="text-xs text-white/40 mt-1">2 saat önce</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-black/10 rounded-lg border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Ödeme Alındı</p>
                          <p className="text-sm text-white/60">Taşıt kredisi ödemesi başarılı</p>
                          <p className="text-xs text-white/40 mt-1">1 gün önce</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-black/10 rounded-lg border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Geciken Ödeme</p>
                          <p className="text-sm text-white/60">Türkiye İş Bankası Kredinizin 4. Takisiti Gecikti!</p>
                          <p className="text-xs text-white/40 mt-1">3 gün önce</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2 relative">
                  <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-6">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span className="text-white/80 text-sm font-medium">Akıllı Bildirimler</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Hiçbir Ödemeyi <span className="text-teal-400">Kaçırmayın</span>
                  </h2>
                  <p className="text-lg text-white/70 mb-8 leading-relaxed">
                    Ödeme tarihleri, faiz oranı değişiklikleri ve önemli güncellemeler için
                    anında bildirim alın. Finansal kontrolünüzü elinizde tutun.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Özelleştirilebilir Bildirimler</h4>
                        <p className="text-white/60">İstediğiniz zaman ve yöntemle bildirim alın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Akıllı Hatırlatıcılar</h4>
                        <p className="text-white/60">1, 3 veya 7 gün önceden hatırlatma seçenekleri</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">E-posta & Uygulama Bildirimleri</h4>
                        <p className="text-white/60">Hem e-posta hem de uygulama içi bildirimler</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics & Reports */}
            <div>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative">
                  <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-6">
                    <LineChart className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80 text-sm font-medium">Analiz & Raporlar</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Finansal Durumunuzu <span className="text-emerald-400">Görselleştirin</span>
                  </h2>
                  <p className="text-lg text-white/70 mb-8 leading-relaxed">
                    Detaylı grafikler ve raporlar ile harcamalarınızı analiz edin.
                    Gelecek planlaması yapın ve tasarruf edin.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <PieChart className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">İnteraktif Grafikler</h4>
                        <p className="text-white/60">Pasta, çubuk ve çizgi grafiklerle görselleştirme</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">PDF & Excel Export</h4>
                        <p className="text-white/60">Raporlarınızı istediğiniz formatta dışa aktarın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Hedef Takibi</h4>
                        <p className="text-white/60">Finansal hedeflerinize ulaşma sürecinizi izleyin</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Aylık Özet</h3>
                      <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm text-emerald-400">
                        Aralık 2025
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg p-4 border border-emerald-500/20">
                        <p className="text-sm text-white/60 mb-1">Toplam Borç</p>
                        <p className="text-2xl font-bold">₺560K</p>
                      </div>
                      <div className="bg-black/10 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-white/60 mb-1">Bu Ay Ödeme</p>
                        <p className="text-2xl font-bold">₺18.5K</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white/60">Konut</span>
                          <span className="font-medium">₺12,000</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: "65%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white/60">Taşıt</span>
                          <span className="font-medium">₺5,000</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: "27%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white/60">İhtiyaç</span>
                          <span className="font-medium">₺1,500</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: "8%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Performance */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Güvenlik & <span className="text-emerald-400">Performans</span>
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Verileriniz bankacılık seviyesi güvenlik ile korunur
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <Shield className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg text-white font-bold mb-2">256-bit SSL</h3>
                    <p className="text-white/60 text-sm">Bankacılık seviyesi şifreleme</p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/30 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                      <Zap className="w-8 h-8 text-teal-400" />
                    </div>
                    <h3 className="text-lg text-white font-bold mb-2">{"<3s İşlem"}</h3>
                    <p className="text-white/60 text-sm">Yıldırım hızında işlem süresi</p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <RefreshCw className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg text-white font-bold mb-2">99.9% Uptime</h3>
                    <p className="text-white/60 text-sm">Her zaman erişilebilir</p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/30 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                      <Lock className="w-8 h-8 text-teal-400" />
                    </div>
                    <h3 className="text-lg text-white font-bold mb-2">KVKK Uyumlu</h3>
                    <p className="text-white/60 text-sm">Veri güvenliği garantisi</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl p-12 md:p-16 text-center backdrop-blur-xl border border-white/10 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Tüm Özellikleri <span className="text-emerald-400">Keşfedin</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Kredi Takip'in güçlü özelliklerini deneyimleyin ve finansal yönetiminizi bir üst seviyeye taşıyın
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/giris">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                    >
                      Ücretsiz Başla
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                  >
                    Demo Talep Et
                  </Button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 text-white/80">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1 text-emerald-400">25+</div>
                    <div className="text-sm">Desteklenen Banka</div>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1 text-emerald-400">99.8%</div>
                    <div className="text-sm">Doğruluk Oranı</div>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1 text-emerald-400">{"<3s"}</div>
                    <div className="text-sm">İşlem Süresi</div>
                  </div>
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
