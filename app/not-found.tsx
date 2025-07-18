"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ArrowLeft, Search, HelpCircle, Mail, Phone } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* 404 Content */}
        <section className="pt-20 pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              {/* 404 Animation */}
              <div className="mb-8">
                <h1 className="text-9xl md:text-[12rem] font-bold text-emerald-400/20 leading-none select-none">404</h1>
                <div className="relative -mt-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Sayfa Bulunamadı</h2>
                  <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönebilir veya aşağıdaki
                    linklerden devam edebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 h-12 px-8">
                    <Home className="w-5 h-5 mr-2" />
                    Ana Sayfaya Dön
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Geri Git
                </Button>
              </div>
            </div>

            {/* Popular Pages */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Özellikler</h3>
                  <p className="text-white/70 text-sm mb-4">Tüm özellikler</p>
                  <Link href="/ozellikler">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                    >
                      Keşfet
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Hakkımızda</h3>
                  <p className="text-white/70 text-sm mb-4">Kredi Takip hakkında bilgi alın</p>
                  <Link href="/hakkimizda">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                    >
                      Öğren
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">İletişim</h3>
                  <p className="text-white/70 text-sm mb-4">Bizimle iletişime geçin</p>
                  <Link href="/iletisim">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                    >
                      İletişim
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Yardıma mı ihtiyacınız var?</h3>
              <p className="text-white/70 mb-6">
                Aradığınızı bulamadıysanız, destek ekibimizle iletişime geçebilirsiniz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@kreditakip.com.tr"
                  className="flex items-center gap-2 text-emerald-400 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  info@kreditakip.com.tr
                </a>
                <a href="tel:+905432035309" className="flex items-center gap-2 text-teal-400 hover:underline">
                  <Phone className="w-4 h-4" />0 543 203 53 09
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
