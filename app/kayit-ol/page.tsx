"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield, Zap, Users, CheckCircle, Mail, Phone } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeKvkk: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic here
    console.log("Form submitted:", formData)
  }

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        <section className="pt-20 pb-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - Form */}
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="text-emerald-400">Hesap</span> Oluştur
                  </h1>
                  <p className="text-xl text-white/70">Kredi takibinizi kolaylaştırmak için hemen kayıt olun</p>
                </div>

                <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-center">Kayıt Formu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-white">
                            Ad
                          </Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                            placeholder="Adınız"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-white">
                            Soyad
                          </Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                            placeholder="Soyadınız"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">
                          E-posta
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                          placeholder="ornek@email.com"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white">
                          Telefon
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                          placeholder="0 5XX XXX XX XX"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white">
                          Şifre
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="En az 8 karakter"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white">
                          Şifre Tekrar
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="Şifrenizi tekrar girin"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeTerms"
                            checked={formData.agreeTerms}
                            onCheckedChange={(checked) => handleCheckboxChange("agreeTerms", checked as boolean)}
                            className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <Label htmlFor="agreeTerms" className="text-sm text-white/80 leading-relaxed">
                            <Link href="/kullanim-sartlari" className="text-emerald-400 hover:underline">
                              Kullanım Şartları
                            </Link>
                            'nı okudum ve kabul ediyorum.
                          </Label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeKvkk"
                            checked={formData.agreeKvkk}
                            onCheckedChange={(checked) => handleCheckboxChange("agreeKvkk", checked as boolean)}
                            className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <Label htmlFor="agreeKvkk" className="text-sm text-white/80 leading-relaxed">
                            <Link href="/kvkk-aydinlatma" className="text-emerald-400 hover:underline">
                              KVKK Aydınlatma Metni
                            </Link>
                            'ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
                          </Label>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 h-12"
                        disabled={!formData.agreeTerms || !formData.agreeKvkk}
                      >
                        Hesap Oluştur
                      </Button>

                      {/* Google Sign Up */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-[#151515] px-4 text-white/60">veya</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-transparent border-white/20 hover:bg-white/10 hover:text-white h-12"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google ile Kayıt Ol
                      </Button>

                      {/* Login Link */}
                      <div className="text-center">
                        <p className="text-white/70">
                          Zaten hesabınız var mı?{" "}
                          <Link href="/giris" className="text-emerald-400 hover:underline font-medium">
                            Giriş Yapın
                          </Link>
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Benefits */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Neden Kredi Takip?</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Hızlı ve Kolay</h3>
                        <p className="text-white/70">
                          Kredi dökümlerinizi yükleyin, otomatik analiz ile dakikalar içinde dijital planınızı alın.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Güvenli ve Şifreli</h3>
                        <p className="text-white/70">
                          Tüm verileriniz endüstri standardı şifreleme ile korunur. Bankacılık şifreleriniz hiçbir zaman
                          görüntülenemez.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Uzman Desteği</h3>
                        <p className="text-white/70">
                          7/24 teknik destek ve finansal danışmanlık hizmetimizden faydalanın.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Güven Göstergeleri</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white/80">SSL Sertifikası ile Korumalı</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white/80">KVKK Uyumlu Veri İşleme</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white/80">Türkiye Sunucularında Barındırma</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white/80">Üçüncü Taraflarla Veri Paylaşımı Yok</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Yardıma mı ihtiyacınız var?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-emerald-400" />
                      <a href="mailto:info@kreditakip.com.tr" className="text-white/80 hover:text-emerald-400">
                        info@kreditakip.com.tr
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-teal-400" />
                      <a href="tel:+905432035309" className="text-white/80 hover:text-teal-400">
                        0 543 203 53 09
                      </a>
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
