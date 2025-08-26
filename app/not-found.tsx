"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ArrowLeft, Search, HelpCircle, Mail, Phone, FileText, TrendingUp, Shield } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* 404 Content */}
        <section className="pt-20 pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-6xl">
            <div className="relative bg-black/20 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 mb-16">
              {/* Floating Visual Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex justify-center items-center z-0 pointer-events-none">
                <div className="w-48 h-64 bg-white/5 border border-white/10 rounded-2xl -rotate-12 transform transition-transform duration-500 hover:scale-105 shadow-lg p-4 flex flex-col opacity-30">
                  <FileText className="w-8 h-8 text-white/30 mb-4" />
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-white/10 rounded-full" />
                    <div className="w-5/6 h-3 bg-white/10 rounded-full" />
                    <div className="w-full h-3 bg-white/10 rounded-full" />
                    <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                  </div>
                  <p className="text-xs text-white/30 mt-auto">404.pdf</p>
                </div>
                <div className="w-48 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10 rounded-2xl rotate-6 transform transition-transform duration-500 hover:scale-105 shadow-lg ml-[-2rem] p-4 flex flex-col opacity-40">
                  <TrendingUp className="w-8 h-8 text-emerald-400/50 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-white/50">Sayfa Bulunamadı</p>
                    <div className="w-full h-8 bg-white/10 rounded-lg flex items-center px-2">
                      <div className="w-1/4 h-4 bg-red-500/30 rounded-full" />
                    </div>
                  </div>
                  <p className="text-xs text-white/30 mt-auto">Hata Raporu</p>
                </div>
              </div>

              <div className="relative z-10 text-center">
                <div className="mb-8">
                  <div className="relative inline-block">
                    <h1 className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-emerald-400/30 to-teal-400/30 bg-clip-text text-transparent leading-none select-none">
                      404
                    </h1>
                    <div className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-emerald-400/10 leading-none select-none animate-pulse">
                      404
                    </div>
                  </div>
                </div>

                <div className="space-y-6 max-w-3xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    Sayfa <span className="text-emerald-400">Bulunamadı</span>
                  </h2>
                  <p className="text-xl text-white/70 leading-relaxed">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir. Endişelenmeyin, size yardımcı olmak için
                    buradayız.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 h-14 px-8 text-lg">
                      <Home className="w-5 h-5 mr-2" />
                      Ana Sayfaya Dön
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="h-14 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white px-8 text-lg"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Geri Git
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-6">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-white/80 text-sm font-medium">Popüler Sayfalar</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Buradan <span className="text-emerald-400">Devam Edebilirsiniz</span>
                </h3>
                <p className="text-lg text-white/70 max-w-2xl mx-auto">
                  En çok ziyaret edilen sayfalarımızdan birini seçerek devam edebilirsiniz
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    <CardContent className="p-8 text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                          <Search className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Özellikler</h3>
                      <p className="text-white/70 mb-6 leading-relaxed">Kredi Takip'in tüm özelliklerini keşfedin</p>
                      <Link href="/ozellikler">
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-white w-full"
                        >
                          Keşfet
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    <CardContent className="p-8 text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-teal-500/20">
                          <HelpCircle className="w-8 h-8 text-teal-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Hakkımızda</h3>
                      <p className="text-white/70 mb-6 leading-relaxed">Kredi Takip hakkında detaylı bilgi alın</p>
                      <Link href="/hakkimizda">
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-white w-full"
                        >
                          Öğren
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <Card className="relative bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    <CardContent className="p-8 text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-emerald-500/20">
                          <Mail className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">İletişim</h3>
                      <p className="text-white/70 mb-6 leading-relaxed">Bizimle iletişime geçin ve destek alın</p>
                      <Link href="/iletisim">
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-white w-full"
                        >
                          İletişim
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="relative bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 md:p-12 text-center overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Yardıma mı ihtiyacınız var?</h3>
                <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Aradığınızı bulamadıysanız, 7/24 aktif destek ekibimizle iletişime geçebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <a
                    href="mailto:info@kreditakip.com.tr"
                    className="flex items-center gap-3 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-3 hover:bg-emerald-500/20"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">info@kreditakip.com.tr</span>
                  </a>
                  <a
                    href="tel:+905432035309"
                    className="flex items-center gap-3 text-teal-400 hover:text-teal-300 transition-colors bg-teal-500/10 border border-teal-500/20 rounded-xl px-6 py-3 hover:bg-teal-500/20"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">0 543 203 53 09</span>
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
