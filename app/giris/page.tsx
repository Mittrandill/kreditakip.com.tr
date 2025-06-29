"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CreditCard,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Shield,
  Sparkles,
  Users,
  TrendingUp,
  Lock,
  CheckCircle,
} from "lucide-react"
import { signIn, signUp } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("")
  const [registerLastName, setRegisterLastName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Active tab state for programmatic switching
  const [activeTab, setActiveTab] = useState("login")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await signIn(loginEmail, loginPassword)

      if (data?.user && data?.session) {
        toast({
          title: "Giriş Başarılı",
          description: "Yönlendiriliyorsunuz...",
        })
        router.push("/uygulama/ana-sayfa")
      } else if (data?.user && !data?.session) {
        setError("Giriş başarısız. Lütfen e-postanızı doğrulayın.")
        toast({
          variant: "destructive",
          title: "E-posta Doğrulaması Gerekli",
          description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın.",
        })
      } else {
        setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.message && err.message.toLowerCase().includes("email not confirmed")) {
        setError("Giriş başarısız. Lütfen e-postanızı doğrulayın.")
        toast({
          variant: "destructive",
          title: "E-posta Doğrulaması Gerekli",
          description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın.",
        })
      } else {
        setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      setError("Lütfen kullanım şartlarını ve gizlilik politikasını kabul edin.")
      toast({
        variant: "destructive",
        title: "Kayıt Hatası",
        description: "Lütfen kullanım şartlarını ve gizlilik politikasını kabul edin.",
      })
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const data = await signUp(registerEmail, registerPassword, {
        first_name: registerFirstName,
        last_name: registerLastName,
      })

      if (data?.user) {
        toast({
          title: "Kayıt Başarılı!",
          description: "Lütfen e-postanızı kontrol ederek hesabınızı doğrulayın. Doğrulama e-postası gönderildi.",
          duration: 7000,
        })
        setRegisterFirstName("")
        setRegisterLastName("")
        setRegisterEmail("")
        setRegisterPassword("")
        setTermsAccepted(false)
        setActiveTab("login")
      } else {
        setError("Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.")
      }
    } catch (err: any) {
      console.error("Register error:", err)
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        <div className="flex items-center justify-center p-4 pt-24 pb-16 relative">
          <div className="w-full max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Marketing Content */}
              <div className="hidden lg:block space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Türkiye'nin #1 Kredi Takip Platformu</span>
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                    Kredilerinizi Akıllıca Yönetin
                  </h1>
                  <p className="text-xl text-gray-400 leading-relaxed">
                    OCR teknolojisi ve yapay zeka ile PDF ödeme planlarınızı analiz edin, tasarruf fırsatlarını keşfedin
                    ve finansal geleceğinizi güvence altına alın.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-2">25K+</div>
                    <div className="text-sm text-gray-400">Aktif Kullanıcı</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-2">₺2.5M+</div>
                    <div className="text-sm text-gray-400">Toplam Tasarruf</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-2">99.9%</div>
                    <div className="text-sm text-gray-400">Uptime</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {[
                    { icon: CreditCard, text: "PDF ödeme planı analizi" },
                    { icon: TrendingUp, text: "AI destekli risk analizi" },
                    { icon: Shield, text: "Banka seviyesi güvenlik" },
                    { icon: Users, text: "7/24 müşteri desteği" },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                        <feature.icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">SSL Şifreli</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">KVKK Uyumlu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">SOC 2 Sertifikalı</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <div className="text-center mb-8 lg:hidden">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Ana Sayfaya Dön
                  </Link>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      KrediTakip
                    </span>
                  </div>
                  <p className="text-gray-400">Hesabınıza giriş yapın veya yeni hesap oluşturun</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Card className="shadow-2xl border-0 bg-gray-800/50 backdrop-blur-xl border border-gray-700">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Hoş Geldiniz
                    </CardTitle>
                    <CardDescription className="text-center text-gray-400">
                      Kredi takip yolculuğunuza başlayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-700/30 border border-gray-600">
                        <TabsTrigger
                          value="login"
                          className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                        >
                          Giriş Yap
                        </TabsTrigger>
                        <TabsTrigger
                          value="register"
                          className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                        >
                          Kayıt Ol
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="login" className="space-y-4 mt-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">
                              E-posta
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="ornek@email.com"
                              required
                              className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">
                              Şifre
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-gray-300"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="remember" />
                              <Label htmlFor="remember" className="text-sm font-normal text-gray-300">
                                Beni hatırla
                              </Label>
                            </div>
                            <Link href="#" className="text-sm text-emerald-400 hover:text-emerald-300">
                              Şifremi unuttum
                            </Link>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                            disabled={isLoading}
                          >
                            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="register" className="space-y-4 mt-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-gray-300">
                                Ad
                              </Label>
                              <Input
                                id="firstName"
                                placeholder="Adınız"
                                required
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                value={registerFirstName}
                                onChange={(e) => setRegisterFirstName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-gray-300">
                                Soyad
                              </Label>
                              <Input
                                id="lastName"
                                placeholder="Soyadınız"
                                required
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                value={registerLastName}
                                onChange={(e) => setRegisterLastName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="registerEmail" className="text-gray-300">
                              E-posta
                            </Label>
                            <Input
                              id="registerEmail"
                              type="email"
                              placeholder="ornek@email.com"
                              required
                              className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={registerEmail}
                              onChange={(e) => setRegisterEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="registerPassword" className="text-gray-300">
                              Şifre
                            </Label>
                            <div className="relative">
                              <Input
                                id="registerPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-gray-300"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms"
                              checked={termsAccepted}
                              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                              aria-labelledby="terms-label"
                            />
                            <Label
                              htmlFor="terms"
                              id="terms-label"
                              className="text-sm font-normal leading-snug text-gray-300"
                            >
                              <Link
                                href="/kullanim-sartlari"
                                target="_blank"
                                className="text-emerald-400 hover:text-emerald-300 underline"
                              >
                                Kullanım şartlarını
                              </Link>{" "}
                              ve{" "}
                              <Link
                                href="/gizlilik-politikasi"
                                target="_blank"
                                className="text-emerald-400 hover:text-emerald-300 underline"
                              >
                                gizlilik politikasını
                              </Link>{" "}
                              okudum ve kabul ediyorum.
                            </Label>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                            disabled={isLoading}
                          >
                            {isLoading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Güvenli giriş için 256-bit SSL şifreleme kullanılmaktadır
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
