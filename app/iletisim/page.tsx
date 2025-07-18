import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Shield, Headphones } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"

export default function ContactPage() {
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Bizimle <span className="text-emerald-400">İletişime</span> Geçin
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Sorularınız, önerileriniz veya destek talepleriniz için buradayız. Size en iyi hizmeti sunmak için 7/24
              hazırız.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                    <Mail className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">E-posta</h3>
                  <p className="text-white/70 text-sm mb-3">Genel sorularınız için</p>
                  <p className="text-emerald-400 font-medium">info@kreditakip.com</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500/30 transition-colors">
                    <Headphones className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Destek</h3>
                  <p className="text-white/70 text-sm mb-3">Teknik destek için</p>
                  <p className="text-teal-400 font-medium">destek@kreditakip.com</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                    <Phone className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Telefon</h3>
                  <p className="text-white/70 text-sm mb-3">Acil durumlar için</p>
                  <p className="text-emerald-400 font-medium">+90 212 555 0123</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500/30 transition-colors">
                    <Clock className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Çalışma Saatleri</h3>
                  <p className="text-white/70 text-sm mb-3">Destek saatlerimiz</p>
                  <p className="text-teal-400 font-medium">7/24 Aktif</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-8 md:p-12">
              <div className="grid lg:grid-cols-2 gap-16 max-w-full mx-auto">
                {/* Contact Form */}
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">Mesaj Gönderin</h2>
                    <p className="text-white/70">
                      Formu doldurarak bize ulaşabilirsiniz. En kısa sürede size geri dönüş yapacağız.
                    </p>
                  </div>

                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white/80">
                          Ad
                        </Label>
                        <Input id="firstName" placeholder="Adınız" required className="custom-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white/80">
                          Soyad
                        </Label>
                        <Input id="lastName" placeholder="Soyadınız" required className="custom-input" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">
                        E-posta
                      </Label>
                      <Input id="email" type="email" placeholder="ornek@mail.com" required className="custom-input" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80">
                        Telefon <span className="text-white/50">(Opsiyonel)</span>
                      </Label>
                      <Input id="phone" type="tel" placeholder="+90 5XX XXX XX XX" className="custom-input" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white/80">
                        Konu
                      </Label>
                      <Input id="subject" placeholder="Mesajınızın konusu" required className="custom-input" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white/80">
                        Mesaj
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Mesajınızı buraya yazın..."
                        rows={6}
                        required
                        className="custom-input resize-none"
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="privacy"
                        className="mt-1 w-4 h-4 text-emerald-400 bg-transparent border-white/30 rounded focus:ring-emerald-400 focus:ring-2"
                        required
                      />
                      <Label htmlFor="privacy" className="text-sm text-white/70 leading-relaxed">
                        <span className="text-emerald-400">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
                        Kişisel verilerimin işlenmesine onay veriyorum.
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold h-12 text-base hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Mesaj Gönder
                    </Button>
                  </form>
                </div>

                {/* Contact Info & FAQ */}
                <div className="space-y-8">
                  {/* Office Info */}
                  <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-emerald-400" />
                      Ofis Bilgileri
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Merkez Ofis</h4>
                        <p className="text-white/70">
                          Maslak Mahallesi, Büyükdere Caddesi
                          <br />
                          No: 123, Kat: 15
                          <br />
                          34485 Sarıyer/İstanbul
                        </p>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="text-white font-semibold mb-2">Çalışma Saatleri</h4>
                        <div className="space-y-1 text-white/70">
                          <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                          <p>Cumartesi: 10:00 - 16:00</p>
                          <p>Pazar: Kapalı</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Help */}
                  <div className="bg-black/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-teal-400" />
                      Hızlı Yardım
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white font-semibold mb-2">Sık Sorulan Sorular</h4>
                        <p className="text-white/70 text-sm mb-3">En çok merak edilen konulara hızlı cevaplar bulun.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                          >
                          SSS'ye Git
                        </Button>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white font-semibold mb-2">Canlı Destek</h4>
                        <p className="text-white/70 text-sm mb-3">
                          Anında yardım için canlı destek hattımızı kullanın.
                        </p>
                        <Button
                      variant="outline"
                      size="sm"
                      className="h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
                      >
                          Canlı Sohbet
                        </Button>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white font-semibold mb-2">Güvenlik</h4>
                        <p className="text-white/70 text-sm mb-3">Güvenlik ile ilgili endişelerinizi bildirin.</p>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <Shield className="w-4 h-4" />
                          <span>SSL Şifreli İletişim</span>
                        </div>
                      </div>
                    </div>
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
