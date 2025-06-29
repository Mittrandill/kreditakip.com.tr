"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Headphones, Users, Building2 } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic here
    console.log("Form submitted:", formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-6 py-2">
              <MessageCircle className="mr-2 h-5 w-5" />
              İletişim
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bizimle{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                İletişime Geçin
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Sorularınız mı var? Yardıma mı ihtiyacınız var? Uzman ekibimiz size yardımcı olmak için burada.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="bg-gray-800/50 border-gray-700 text-center hover:border-emerald-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Telefon</CardTitle>
                <CardDescription className="text-gray-400">Hemen arayın, anında destek alın</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-400 font-semibold text-lg">+90 212 555 0123</p>
                <p className="text-gray-400 text-sm mt-2">Pazartesi - Cuma: 09:00 - 18:00</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-center hover:border-emerald-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">E-posta</CardTitle>
                <CardDescription className="text-gray-400">24 saat içinde yanıt garantisi</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-blue-400 font-semibold text-lg">destek@kreditakip.com</p>
                <p className="text-gray-400 text-sm mt-2">7/24 e-posta desteği</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 text-center hover:border-emerald-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Ofis</CardTitle>
                <CardDescription className="text-gray-400">Randevu alarak ziyaret edin</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-purple-400 font-semibold">Maslak Mahallesi</p>
                <p className="text-gray-400 text-sm mt-1">Büyükdere Cad. No:123</p>
                <p className="text-gray-400 text-sm">Şişli, İstanbul</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form and Info */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Contact Form */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Mesaj Gönderin</CardTitle>
                <CardDescription className="text-gray-400">Formu doldurun, en kısa sürede size dönelim</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Ad Soyad *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        E-posta *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                        Şirket
                      </label>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        value={formData.company}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                        placeholder="Şirket adınız"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Telefon
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Konu *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                      placeholder="Mesajınızın konusu"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Mesaj *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                      placeholder="Mesajınızı buraya yazın..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Mesaj Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="space-y-8">
              {/* Support Hours */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-emerald-400" />
                    <CardTitle className="text-white">Destek Saatleri</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pazartesi - Cuma</span>
                    <span className="text-emerald-400 font-semibold">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cumartesi</span>
                    <span className="text-emerald-400 font-semibold">10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pazar</span>
                    <span className="text-gray-500">Kapalı</span>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-sm text-gray-400">Acil durumlar için 7/24 e-posta desteği mevcuttur.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Types */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Hangi Konuda Yardım?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Headphones className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">Teknik Destek</p>
                      <p className="text-gray-400 text-sm">Platform kullanımı ve teknik sorunlar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Satış Danışmanlığı</p>
                      <p className="text-gray-400 text-sm">Plan seçimi ve fiyatlandırma</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Kurumsal Çözümler</p>
                      <p className="text-gray-400 text-sm">Özel entegrasyonlar ve kurumsal planlar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Hızlı Bağlantılar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50"
                  >
                    Yardım Merkezi
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50"
                  >
                    API Dokümantasyonu
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50"
                  >
                    Video Eğitimler
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50"
                  >
                    Sistem Durumu
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
