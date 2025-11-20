import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Scan, Zap, Shield, CheckCircle, ArrowRight, FileText, Upload, Sparkles, Brain, Target } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function OCRTechnologyPage() {
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
              <span className="text-white/80 text-sm font-medium">Yapay Zeka Destekli OCR</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-emerald-400">OCR Teknolojisi</span> ile
              <br />
              Anında Belge Analizi
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              %99.8 doğruluk oranıyla kredi dökümlerinizi saniyeler içinde dijital veriye dönüştürün. Yapay zeka
              destekli OCR teknolojimiz ile hızlı ve güvenilir analiz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-base hover:from-emerald-600 hover:to-teal-600"
                >
                  Hemen Deneyin
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-400">99.8%</div>
                  <div className="text-white/60 text-sm">Doğruluk Oranı</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-teal-400">{"<3s"}</div>
                  <div className="text-white/60 text-sm">İşlem Süresi</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-emerald-400">25+</div>
                  <div className="text-white/60 text-sm">Desteklenen Banka</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-teal-400">1.2M+</div>
                  <div className="text-white/60 text-sm">Analiz Edilen Döküm</div>
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
              <p className="text-xl text-white/70 max-w-3xl mx-auto">Üç basit adımda kredi dökümlerinizi analiz edin</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold text-emerald-400 mb-4">1</div>
                  <h3 className="text-xl font-bold text-white mb-4">Belge Yükleyin</h3>
                  <p className="text-white/70">PDF, JPG veya PNG formatında kredi dökümünüzü sisteme yükleyin</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-8 h-8 text-teal-400" />
                  </div>
                  <div className="text-4xl font-bold text-teal-400 mb-4">2</div>
                  <h3 className="text-xl font-bold text-white mb-4">AI Analizi</h3>
                  <p className="text-white/70">
                    Yapay zeka destekli OCR teknolojimiz belgenizi saniyeler içinde analiz eder
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-4xl font-bold text-emerald-400 mb-4">3</div>
                  <h3 className="text-xl font-bold text-white mb-4">Sonuçları Görün</h3>
                  <p className="text-white/70">
                    Detaylı analiz sonuçlarını görüntüleyin ve akıllı önerilerden faydalanın
                  </p>
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
                OCR <span className="text-teal-400">Özellikleri</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Çoklu Format Desteği</h3>
                      <p className="text-white/70">
                        PDF, JPG, PNG formatlarında belgelerinizi yükleyebilir ve analiz edebilirsiniz
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>PDF belge desteği</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Yüksek çözünürlüklü görüntüler</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>10MB'a kadar dosya boyutu</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Hızlı İşlem</h3>
                      <p className="text-white/70">
                        Bulut tabanlı altyapımız sayesinde belgeleriniz saniyeler içinde işlenir
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>3 saniyeden kısa işlem süresi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Gerçek zamanlı sonuçlar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Sınırsız işlem kapasitesi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Güvenli İşlem</h3>
                      <p className="text-white/70">
                        Belgeleriniz AES-256 Şifreleme ile korunur ve işlem sonrası silinir
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>End-to-end şifreleme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>KVKK uyumlu</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Otomatik veri silme</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Scan className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Yüksek Doğruluk</h3>
                      <p className="text-white/70">%99.8 doğruluk oranı ile en hassas OCR teknolojisini kullanıyoruz</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>AI destekli karakter tanıma</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Otomatik hata düzeltme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                      <span>Çoklu dil desteği</span>
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
                  OCR Teknolojisini <span className="text-emerald-400">Deneyin</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Kredi dökümlerinizi saniyeler içinde analiz edin ve finansal özgürlüğünüze kavuşun
                </p>
                <Link href="/giris">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-6 text-lg hover:from-emerald-600 hover:to-teal-600"
                  >
                    Ücretsiz Başla
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
